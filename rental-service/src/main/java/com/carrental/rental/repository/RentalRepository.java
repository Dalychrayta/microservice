package com.carrental.rental.repository;

import com.carrental.rental.entity.Rental;
import com.carrental.rental.entity.RentalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository = la couche d'accès à la base de données.
 *
 * JpaRepository<Rental, Long> :
 * - Rental : le type de l'entité
 * - Long   : le type de la clé primaire (id)
 *
 * Spring génère automatiquement les implémentations des méthodes
 * comme findAll(), findById(), save(), deleteById()...
 * On n'a pas besoin d'écrire du SQL pour ces opérations de base.
 */
@Repository
public interface RentalRepository extends JpaRepository<Rental, Long> {

    // Spring génère automatiquement le SQL :
    // SELECT * FROM rentals WHERE customer_id = ?
    List<Rental> findByCustomerId(String customerId);

    // SELECT * FROM rentals WHERE vehicle_id = ?
    List<Rental> findByVehicleId(Long vehicleId);

    // SELECT * FROM rentals WHERE status = ?
    List<Rental> findByStatus(RentalStatus status);

    // Vérifie le chevauchement de période pour une voiture donnée.
    // start <= newEnd AND end >= newStart  => conflit de réservation
    boolean existsByVehicleIdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long vehicleId,
            List<RentalStatus> statuses,
            LocalDate endDate,
            LocalDate startDate
    );

    // Récupère toutes les réservations confirméEs et pending pour un véhicule
    // (pour afficher les dates bloquées dans le calendrier du frontend)
    List<Rental> findByVehicleIdAndStatusIn(Long vehicleId, List<RentalStatus> statuses);
}
