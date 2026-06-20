package com.carrental.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée de la Gateway.
 *
 * Pas besoin d'annotation spéciale comme @EnableGateway :
 * Spring Cloud Gateway s'active automatiquement dès que
 * la dépendance spring-cloud-starter-gateway est dans le pom.xml
 * et que les routes sont configurées dans application.yml.
 */
@SpringBootApplication
public class GatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
