package com.carrental.gateway.config;

import org.springdoc.core.properties.AbstractSwaggerUiConfigProperties;
import org.springdoc.core.properties.SwaggerUiConfigProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashSet;
import java.util.Set;

/**
 * Configuration Swagger centralisé sur la Gateway.
 *
 * On déclare uniquement les URLs des microservices.
 * SpringDoc crée lui-même le SwaggerUiConfigProperties — on ne le redéfinit pas.
 */
@Configuration
public class SwaggerConfig {

    /**
     * Déclare les URLs des API docs de chaque microservice.
     * Injectées dans SwaggerUiConfigProperties par SpringDoc automatiquement.
     */
    @Bean
    public Set<AbstractSwaggerUiConfigProperties.SwaggerUrl> swaggerUrls(
            SwaggerUiConfigProperties properties) {

        Set<AbstractSwaggerUiConfigProperties.SwaggerUrl> urls = new HashSet<>();

        urls.add(new AbstractSwaggerUiConfigProperties.SwaggerUrl(
            "rental-service",
            "/v3/api-docs/rental-service",
            "Rental Service API"
        ));

        urls.add(new AbstractSwaggerUiConfigProperties.SwaggerUrl(
            "vehicle-service",
            "/v3/api-docs/vehicle-service",
            "Vehicle Service API"
        ));

        // On injecte les URLs dans le bean existant de SpringDoc
        properties.setUrls(urls);
        properties.setUrlsPrimaryName("rental-service");

        return urls;
    }
}
