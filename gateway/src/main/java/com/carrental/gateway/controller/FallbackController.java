package com.carrental.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Fallback Controller : réponse de secours quand un microservice est indisponible.
 *
 * Circuit Breaker Pattern :
 * Si vehicle-service ne répond pas après X tentatives,
 * au lieu de laisser le client attendre indéfiniment,
 * la Gateway retourne immédiatement une réponse d'erreur claire.
 *
 * C'est le pattern "Circuit Breaker" : comme un disjoncteur électrique,
 * il "coupe le circuit" si trop d'erreurs sont détectées.
 *
 * Question probable de la prof :
 * "C'est quoi un Circuit Breaker ?"
 * → C'est un pattern de résilience. Si un service est en panne,
 *   le circuit s'ouvre et les appels retournent une erreur immédiate
 *   au lieu d'attendre un timeout. Ça évite l'effet cascade
 *   où la panne d'un service fait tomber tout le système.
 */
@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @RequestMapping("/vehicle")
    public ResponseEntity<Map<String, String>> vehicleFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                    "status", "error",
                    "message", "Vehicle service is currently unavailable. Please try again later.",
                    "service", "vehicle-service"
                ));
    }

    @RequestMapping("/rental")
    public ResponseEntity<Map<String, String>> rentalFallback() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                    "status", "error",
                    "message", "Rental service is currently unavailable. Please try again later.",
                    "service", "rental-service"
                ));
    }
}
