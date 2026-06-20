package com.carrental.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuration CORS (Cross-Origin Resource Sharing).
 *
 * Problème : le frontend React tourne sur http://localhost:3000
 * et la Gateway tourne sur http://localhost:8080.
 * Les navigateurs bloquent par défaut les requêtes entre origines différentes.
 *
 * CORS est la solution : on dit au navigateur quelles origines sont autorisées.
 *
 * Question probable de la prof :
 * "C'est quoi CORS et pourquoi tu l'as configuré ici ?"
 * → CORS est un mécanisme de sécurité du navigateur. Je l'ai configuré
 *   au niveau de la Gateway car c'est le seul point d'entrée.
 *   Je n'ai pas besoin de le configurer dans chaque microservice.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // Origines autorisées : le frontend React en local et en Docker
        config.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://frontend:3000"
        ));

        // Méthodes HTTP autorisées
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Headers autorisés
        config.setAllowedHeaders(List.of("*"));

        // Autorise l'envoi des cookies et du header Authorization
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // Applique à toutes les routes

        return new CorsWebFilter(source);
    }
}
