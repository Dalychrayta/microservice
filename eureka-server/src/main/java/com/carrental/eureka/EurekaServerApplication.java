package com.carrental.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * Point d'entrée du serveur Eureka.
 *
 * @EnableEurekaServer : c'est cette annotation qui transforme
 * ce simple projet Spring Boot en serveur de découverte.
 * Sans elle, c'est juste une application Spring Boot ordinaire.
 */
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
