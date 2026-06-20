package com.carrental.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.config.server.EnableConfigServer;

/**
 * Point d'entrée du Config Server.
 *
 * @EnableConfigServer : active le serveur de configuration centralisé.
 * Les microservices vont appeler ce serveur au démarrage pour
 * récupérer leur fichier de configuration.
 */
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConfigServerApplication.class, args);
    }
}
