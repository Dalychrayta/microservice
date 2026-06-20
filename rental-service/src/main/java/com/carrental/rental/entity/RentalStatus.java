package com.carrental.rental.entity;

/**
 * Enum pour le statut d'une location.
 * Utiliser un enum au lieu d'un String évite les erreurs de frappe
 * et limite les valeurs possibles.
 */
public enum RentalStatus {
    PENDING,    // En attente
    CONFIRMED,  // Confirmée
    CANCELLED,  // Annulée
    COMPLETED   // Terminée
}
