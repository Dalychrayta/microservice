package com.carrental.rental.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * CLIENT FEIGN = Communication SYNCHRONE entre rental-service et vehicle-service.
 *
 * Comment ça fonctionne :
 * - On définit une interface avec les endpoints qu'on veut appeler sur vehicle-service
 * - @FeignClient("vehicle-service") : Feign va chercher l'adresse de "vehicle-service"
 *   dans Eureka automatiquement
 * - Spring génère l'implémentation de cette interface au démarrage
 * - On injecte VehicleClient comme un service normal avec @Autowired
 *
 * C'est SYNCHRONE : rental-service attend la réponse de vehicle-service
 * avant de continuer. Si vehicle-service est down, la requête échoue.
 *
 * Question probable de la prof :
 * "C'est quoi la différence entre Feign et RestTemplate ?"
 * → Feign est déclaratif (on écrit juste une interface),
 *   RestTemplate est impératif (on écrit le code HTTP manuellement).
 *   Feign s'intègre aussi automatiquement avec Eureka pour la résolution d'adresses.
 */
@FeignClient(name = "vehicle-service")
public interface VehicleClient {

    /**
     * Appelle GET http://vehicle-service/api/vehicles/{id}
     * pour récupérer les détails d'un véhicule
     */
    @GetMapping("/api/vehicles/{id}")
    VehicleResponse getVehicleById(@PathVariable Long id);

    /**
     * Appelle PUT http://vehicle-service/api/vehicles/{id}/availability
     * pour changer la disponibilité d'un véhicule
     */
    @PutMapping("/api/vehicles/{id}/availability")
    void updateVehicleAvailability(@PathVariable Long id,
                                   @RequestParam boolean available);
}
