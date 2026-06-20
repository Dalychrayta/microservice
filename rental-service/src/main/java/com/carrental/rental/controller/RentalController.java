package com.carrental.rental.controller;

import com.carrental.rental.dto.RentalRequest;
import com.carrental.rental.dto.RentalResponse;
import com.carrental.rental.service.RentalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST = la couche qui expose les endpoints HTTP.
 * C'est le point d'entrée des requêtes venant de la Gateway.
 *
 * @RestController : combine @Controller + @ResponseBody
 *                  (retourne du JSON directement)
 * @RequestMapping : préfixe de toutes les routes de ce controller
 *
 * Sécurité :
 * @PreAuthorize("hasRole('CLIENT')") : seuls les utilisateurs avec le rôle CLIENT peuvent accéder
 * @PreAuthorize("hasRole('ADMIN')")  : seuls les ADMIN peuvent accéder
 * Le token JWT vient de Keycloak via la Gateway
 */
@RestController
@RequestMapping("/api/rentals")
@RequiredArgsConstructor
@Tag(name = "Rental API", description = "Gestion des locations de voitures")
public class RentalController {

    private final RentalService rentalService;

    /**
     * POST /api/rentals
     * Crée une nouvelle location.
     * Accessible par les CLIENT uniquement.
     *
     * @AuthenticationPrincipal Jwt jwt : récupère les infos du token JWT Keycloak
     */
    @PostMapping
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN')")
    @Operation(summary = "Créer une location", description = "Crée une nouvelle demande de location de voiture")
    public ResponseEntity<RentalResponse> createRental(
            @Valid @RequestBody RentalRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        // On récupère l'ID du client depuis le token JWT Keycloak
        String customerId = jwt.getSubject(); // "sub" = l'ID unique de l'utilisateur dans Keycloak
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(rentalService.createRental(request, customerId));
    }

    /**
     * PUT /api/rentals/{id}/confirm
     * Confirme une location (PENDING → CONFIRMED).
     * Accessible par les ADMIN et AGENT uniquement.
     */
    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasRole('ADMIN') or hasRole('AGENT')")
    @Operation(summary = "Confirmer une location")
    public ResponseEntity<RentalResponse> confirmRental(@PathVariable Long id) {
        return ResponseEntity.ok(rentalService.confirmRental(id));
    }

    /**
     * PUT /api/rentals/{id}/cancel
     * Annule une location.
     */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN') or hasRole('AGENT')")
    @Operation(summary = "Annuler une location")
    public ResponseEntity<RentalResponse> cancelRental(@PathVariable Long id) {
        return ResponseEntity.ok(rentalService.cancelRental(id));
    }

    /**
     * GET /api/rentals/my
     * Récupère les locations du client connecté.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN')")
    @Operation(summary = "Mes locations", description = "Récupère les locations de l'utilisateur connecté")
    public ResponseEntity<List<RentalResponse>> getMyRentals(@AuthenticationPrincipal Jwt jwt) {
        String customerId = jwt.getSubject();
        return ResponseEntity.ok(rentalService.getRentalsByCustomer(customerId));
    }

    /**
     * GET /api/rentals
     * Récupère toutes les locations (admin et agent).
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('AGENT')")
    @Operation(summary = "Toutes les locations", description = "Admin/Agent - récupère toutes les locations")
    public ResponseEntity<List<RentalResponse>> getAllRentals() {
        return ResponseEntity.ok(rentalService.getAllRentals());
    }

    /**
     * GET /api/rentals/{id}
     * Récupère une location par son ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN') or hasRole('AGENT')")
    @Operation(summary = "Détails d'une location")
    public ResponseEntity<RentalResponse> getRentalById(@PathVariable Long id) {
        return ResponseEntity.ok(rentalService.getRentalById(id));
    }
}
