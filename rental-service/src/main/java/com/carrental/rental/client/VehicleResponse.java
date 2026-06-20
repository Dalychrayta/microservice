package com.carrental.rental.client;

import lombok.Data;

/**
 * Représentation locale de la réponse de vehicle-service.
 * On ne prend que les champs dont on a besoin côté rental-service.
 * C'est une bonne pratique : chaque MS ne consomme que ce dont il a besoin.
 */
@Data
public class VehicleResponse {
    private Long id;
    private String brand;
    private String model;
    private String category;
    private Double pricePerDay;
    private boolean available;
}
