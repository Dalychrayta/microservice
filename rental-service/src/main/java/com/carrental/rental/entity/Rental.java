package com.carrental.rental.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entité Rental = une ligne dans la table "rentals" de MySQL.
 *
 * @Entity : dit à JPA que cette classe correspond à une table en base
 * @Table  : précise le nom de la table
 *
 * Lombok annotations :
 * @Data          : génère automatiquement getters, setters, toString, equals, hashCode
 * @Builder       : permet d'écrire Rental.builder().vehicleId(1L).build()
 * @NoArgsConstructor : génère un constructeur sans arguments (requis par JPA)
 * @AllArgsConstructor : génère un constructeur avec tous les arguments
 */
@Entity
@Table(name = "rentals")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Rental {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-increment en MySQL
    private Long id;

    // ID de la voiture louée (référence vers vehicle-service)
    // On ne met pas de @ManyToOne car vehicle-service est un MS séparé
    // Les MS ne partagent pas leur base de données
    @Column(nullable = false)
    private Long vehicleId;

    // Identifiant du client (vient de Keycloak)
    @Column(nullable = false)
    private String customerId;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    // Prix total calculé : (endDate - startDate) * pricePerDay
    @Column(nullable = false)
    private Double totalPrice;

    /**
     * Statut de la location :
     * PENDING   → créée, en attente de confirmation
     * CONFIRMED → confirmée, la voiture est réservée
     * CANCELLED → annulée
     * COMPLETED → location terminée
     */
    @Enumerated(EnumType.STRING) // Stocke "PENDING" en base, pas "0"
    @Column(nullable = false)
    private RentalStatus status;

    // Date de création automatique
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist // Exécuté automatiquement avant chaque insertion en base
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = RentalStatus.PENDING;
        }
    }
}
