package com.carrental.rental.dto;

import com.carrental.rental.entity.RentalStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO de réponse = ce qu'on retourne au client.
 * Contient toutes les infos de la location + les infos du véhicule.
 */
@Data
@Builder
public class RentalResponse {
    private Long id;
    private Long vehicleId;
    private String vehicleBrand;   // Récupéré depuis vehicle-service via Feign
    private String vehicleModel;   // Récupéré depuis vehicle-service via Feign
    private String customerId;
    private String customerName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double totalPrice;
    private RentalStatus status;
    private LocalDateTime createdAt;
}
