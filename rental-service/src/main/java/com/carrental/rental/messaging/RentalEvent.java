package com.carrental.rental.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * L'événement publié dans RabbitMQ.
 * C'est ce message qui est envoyé dans la queue et consommé par vehicle-service.
 *
 * C'est une bonne pratique de créer une classe dédiée pour les events,
 * ça rend le contrat entre les microservices explicite et clair.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalEvent {
    private Long rentalId;
    private Long vehicleId;
    private String customerId;
    private String customerName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String eventType; // "CONFIRMED" ou "CANCELLED"
}
