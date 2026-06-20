package com.carrental.rental.service;

import com.carrental.rental.client.VehicleClient;
import com.carrental.rental.client.VehicleResponse;
import com.carrental.rental.dto.RentalRequest;
import com.carrental.rental.dto.RentalResponse;
import com.carrental.rental.entity.Rental;
import com.carrental.rental.entity.RentalStatus;
import com.carrental.rental.messaging.RentalEvent;
import com.carrental.rental.messaging.RentalEventPublisher;
import com.carrental.rental.repository.RentalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service = la couche logique métier.
 * C'est ici que se trouvent toutes les règles de l'application.
 * Le Controller appelle le Service, le Service appelle le Repository.
 *
 * Architecture en couches :
 * Controller → Service → Repository → Base de données
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional // Toutes les méthodes sont dans une transaction par défaut
public class RentalService {

    private final RentalRepository rentalRepository;
    private final VehicleClient vehicleClient;           // Communication SYNCHRONE (Feign)
    private final RentalEventPublisher eventPublisher;   // Communication ASYNCHRONE (RabbitMQ)

    /**
     * Crée une nouvelle location.
     *
     * Scénario de communication SYNCHRONE avec Feign :
     * 1. Client envoie une requête de location
     * 2. rental-service appelle vehicle-service via Feign pour vérifier la dispo
     * 3. Si disponible → on crée la location en base MySQL
     * 4. Si non disponible → on lance une exception
     */
    public RentalResponse createRental(RentalRequest request, String customerId) {
        log.info("Creating rental for vehicle {} by customer {}", request.getVehicleId(), customerId);

        // ÉTAPE 1 : Appel SYNCHRONE via Feign vers vehicle-service
        // rental-service attend la réponse avant de continuer
        VehicleResponse vehicle = vehicleClient.getVehicleById(request.getVehicleId());

        // ÉTAPE 2 : Vérification de la disponibilité
        if (!vehicle.isAvailable()) {
            throw new RuntimeException("Vehicle " + request.getVehicleId() + " is not available");
        }

        // ÉTAPE 3 : Calcul du prix total
        // ChronoUnit.DAYS.between() calcule le nombre de jours entre deux dates
        long days = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());
        if (days <= 0) {
            throw new RuntimeException("End date must be after start date");
        }

        boolean hasOverlap = rentalRepository
            .existsByVehicleIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                request.getVehicleId(),
                List.of(RentalStatus.PENDING, RentalStatus.CONFIRMED),
                request.getEndDate(),
                request.getStartDate()
            );
        if (hasOverlap) {
            throw new RuntimeException("Ce véhicule est déjà réservé sur cette période.");
        }

        double totalPrice = days * vehicle.getPricePerDay();

        // ÉTAPE 4 : Création et sauvegarde en base MySQL
        Rental rental = Rental.builder()
                .vehicleId(request.getVehicleId())
                .customerId(customerId)
                .customerName(request.getCustomerName())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalPrice(totalPrice)
                .status(RentalStatus.PENDING)
                .build();

        rental = rentalRepository.save(rental);
        log.info("Rental created with ID: {}", rental.getId());

        return buildResponse(rental, vehicle);
    }

    /**
     * Confirme une location.
     *
     * Scénario de communication ASYNCHRONE avec RabbitMQ :
     * 1. On confirme la location en base
     * 2. On publie un event dans RabbitMQ
     * 3. vehicle-service consomme l'event et met à jour la dispo
     * rental-service n'attend pas que vehicle-service finisse → ASYNCHRONE
     */
    public RentalResponse confirmRental(Long rentalId) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Rental not found: " + rentalId));

        if (rental.getStatus() != RentalStatus.PENDING) {
            throw new RuntimeException("Only PENDING rentals can be confirmed");
        }

        // ÉTAPE 1 : Mise à jour du statut en base
        rental.setStatus(RentalStatus.CONFIRMED);
        rental = rentalRepository.save(rental);

        // ÉTAPE 2 : Publication de l'event ASYNCHRONE via RabbitMQ
        // rental-service publie le message et CONTINUE sans attendre
        // vehicle-service recevra le message et mettra à jour la dispo de la voiture
        RentalEvent event = RentalEvent.builder()
                .rentalId(rental.getId())
                .vehicleId(rental.getVehicleId())
                .customerId(rental.getCustomerId())
                .customerName(rental.getCustomerName())
                .startDate(rental.getStartDate())
                .endDate(rental.getEndDate())
                .eventType("CONFIRMED")
                .build();

        eventPublisher.publishRentalConfirmed(event);

        // Récupération des détails du véhicule pour la réponse
        VehicleResponse vehicle = vehicleClient.getVehicleById(rental.getVehicleId());
        return buildResponse(rental, vehicle);
    }

    /**
     * Annule une location et publie un event pour libérer la voiture.
     */
    public RentalResponse cancelRental(Long rentalId) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Rental not found: " + rentalId));

        if (rental.getStatus() == RentalStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed rental");
        }

        rental.setStatus(RentalStatus.CANCELLED);
        rental = rentalRepository.save(rental);

        // Publier l'event d'annulation → vehicle-service remet la voiture disponible
        RentalEvent event = RentalEvent.builder()
                .rentalId(rental.getId())
                .vehicleId(rental.getVehicleId())
                .customerId(rental.getCustomerId())
                .customerName(rental.getCustomerName())
                .startDate(rental.getStartDate())
                .endDate(rental.getEndDate())
                .eventType("CANCELLED")
                .build();

        eventPublisher.publishRentalCancelled(event);

        VehicleResponse vehicle = vehicleClient.getVehicleById(rental.getVehicleId());
        return buildResponse(rental, vehicle);
    }

    /**
     * Termine une location confirmée et publie un event
     * pour libérer la voiture côté vehicle-service.
     */
    public RentalResponse completeRental(Long rentalId) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Rental not found: " + rentalId));

        if (rental.getStatus() != RentalStatus.CONFIRMED) {
            throw new RuntimeException("Only CONFIRMED rentals can be completed");
        }

        rental.setStatus(RentalStatus.COMPLETED);
        rental = rentalRepository.save(rental);

        RentalEvent event = RentalEvent.builder()
                .rentalId(rental.getId())
                .vehicleId(rental.getVehicleId())
                .customerId(rental.getCustomerId())
                .customerName(rental.getCustomerName())
                .startDate(rental.getStartDate())
                .endDate(rental.getEndDate())
                .eventType("COMPLETED")
                .build();

        eventPublisher.publishRentalCompleted(event);

        VehicleResponse vehicle = vehicleClient.getVehicleById(rental.getVehicleId());
        return buildResponse(rental, vehicle);
    }

    /**
     * Récupère toutes les locations d'un client.
     */
    public List<RentalResponse> getRentalsByCustomer(String customerId) {
        return rentalRepository.findByCustomerId(customerId)
                .stream()
                .map(rental -> {
                    VehicleResponse vehicle = vehicleClient.getVehicleById(rental.getVehicleId());
                    return buildResponse(rental, vehicle);
                })
                .collect(Collectors.toList());
    }

    /**
     * Récupère toutes les locations (pour l'admin).
     */
    public List<RentalResponse> getAllRentals() {
        return rentalRepository.findAll()
                .stream()
                .map(rental -> {
                    VehicleResponse vehicle = vehicleClient.getVehicleById(rental.getVehicleId());
                    return buildResponse(rental, vehicle);
                })
                .collect(Collectors.toList());
    }

    /**
     * Récupère une location par son ID.
     */
    public RentalResponse getRentalById(Long rentalId) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new RuntimeException("Rental not found: " + rentalId));
        VehicleResponse vehicle = vehicleClient.getVehicleById(rental.getVehicleId());
        return buildResponse(rental, vehicle);
    }

    /**
     * Méthode privée utilitaire qui construit le DTO de réponse
     * à partir d'une entité Rental et des données du véhicule.
     */
    private RentalResponse buildResponse(Rental rental, VehicleResponse vehicle) {
        return RentalResponse.builder()
                .id(rental.getId())
                .vehicleId(rental.getVehicleId())
                .vehicleBrand(vehicle.getBrand())
                .vehicleModel(vehicle.getModel())
                .customerId(rental.getCustomerId())
                .customerName(rental.getCustomerName())
                .startDate(rental.getStartDate())
                .endDate(rental.getEndDate())
                .totalPrice(rental.getTotalPrice())
                .status(rental.getStatus())
                .createdAt(rental.getCreatedAt())
                .build();
    }
}
