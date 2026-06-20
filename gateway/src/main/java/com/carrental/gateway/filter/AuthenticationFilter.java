package com.carrental.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Filtre global de la Gateway.
 *
 * Un GlobalFilter s'applique à TOUTES les requêtes qui passent par la Gateway.
 * C'est ici qu'on peut :
 * - Logger les requêtes entrantes
 * - Ajouter des headers avant de transmettre aux microservices
 * - Mesurer les temps de réponse
 *
 * Ce filtre récupère le token JWT et le transmet aux microservices
 * dans le header "Authorization", pour que chaque MS puisse
 * identifier l'utilisateur sans redemander à Keycloak.
 *
 * Question probable de la prof :
 * "C'est quoi un GlobalFilter dans Spring Cloud Gateway ?"
 * → C'est un filtre qui intercepte toutes les requêtes.
 *   Le GlobalFilter s'applique à toutes les routes,
 *   contrairement au GatewayFilter qui s'applique à une route spécifique.
 */
@Component
@Slf4j
public class AuthenticationFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Log de chaque requête entrante
        final String path = exchange.getRequest().getURI().getPath();
        final String method = exchange.getRequest().getMethod().name();
        log.info("Gateway received: {} {}", method, path);

        // Récupère le token JWT depuis le header Authorization
        final String authHeader = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        // Variables final obligatoires pour être utilisées dans les lambdas Java
        final ServerWebExchange mutatedExchange;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            log.debug("JWT token found, forwarding to microservice");

            // Transmet le token tel quel au microservice en aval
            // Le microservice validera le token avec sa propre config Keycloak
            mutatedExchange = exchange.mutate()
                    .request(r -> r.header(HttpHeaders.AUTHORIZATION, authHeader))
                    .build();
        } else {
            mutatedExchange = exchange;
        }

        // chain.filter() passe la requête au filtre suivant (ou au microservice)
        return chain.filter(mutatedExchange).then(Mono.fromRunnable(() -> {
            // Exécuté après la réponse du microservice
            int statusCode = mutatedExchange.getResponse().getStatusCode() != null
                    ? mutatedExchange.getResponse().getStatusCode().value()
                    : 0;
            log.info("Gateway response: {} {} → {}", method, path, statusCode);
        }));
    }

    /**
     * Ordre d'exécution du filtre.
     * -1 = s'exécute avant les autres filtres (priorité haute).
     */
    @Override
    public int getOrder() {
        return -1;
    }
}
