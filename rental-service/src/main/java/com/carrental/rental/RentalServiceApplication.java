package com.carrental.rental;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * Point d'entrée du Rental Service.
 *
 * @EnableFeignClients : active les clients Feign dans ce projet.
 * Sans cette annotation, l'interface VehicleClient ne fonctionnerait pas.
 * Feign va scanner les interfaces annotées @FeignClient et créer
 * automatiquement leur implémentation.
 */
@SpringBootApplication
@EnableFeignClients
public class RentalServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(RentalServiceApplication.class, args);
    }
}
