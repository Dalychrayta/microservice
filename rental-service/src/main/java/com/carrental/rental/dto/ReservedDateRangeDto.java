package com.carrental.rental.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO pour retourner une plage de dates réservée.
 * Utilisé par l'endpoint GET /api/rentals/vehicle/{vehicleId}/reserved-dates
 * pour afficher les dates indisponibles dans le calendrier frontend.
 */
@Data
@Builder
@AllArgsConstructor
public class ReservedDateRangeDto {
    private LocalDate startDate;
    private LocalDate endDate;
}
