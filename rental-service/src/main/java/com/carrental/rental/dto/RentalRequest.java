package com.carrental.rental.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO (Data Transfer Object) = ce que le client envoie dans le body de la requête.
 *
 * On utilise un DTO séparé de l'entité pour :
 * 1. Ne pas exposer tous les champs de l'entité (ex: id, createdAt sont générés côté serveur)
 * 2. Valider les données avant de les traiter
 *
 * Les annotations de validation lancent une erreur 400 si les données sont invalides.
 */
@Data
public class RentalRequest {

    @NotNull(message = "L'ID du véhicule est obligatoire")
    private Long vehicleId;

    @NotBlank(message = "Le nom du client est obligatoire")
    private String customerName;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate startDate;

    @NotNull(message = "La date de fin est obligatoire")
    @Future(message = "La date de fin doit être dans le futur")
    private LocalDate endDate;
}
