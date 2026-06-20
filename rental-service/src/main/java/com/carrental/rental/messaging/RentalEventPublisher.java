package com.carrental.rental.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/**
 * Publisher RabbitMQ = celui qui ENVOIE les messages dans la queue.
 *
 * Communication ASYNCHRONE :
 * rental-service envoie un message et continue son travail
 * sans attendre que vehicle-service le traite.
 * C'est le contraire de Feign qui est synchrone (attend la réponse).
 *
 * @Slf4j : génère un logger "log" via Lombok pour tracer les événements
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RentalEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Publie un événement "location confirmée" dans RabbitMQ.
     * vehicle-service va consommer ce message et marquer la voiture comme indisponible.
     */
    public void publishRentalConfirmed(RentalEvent event) {
        log.info("Publishing rental confirmed event for rental ID: {}", event.getRentalId());

        // convertAndSend(exchange, routingKey, message)
        // - exchange : "rental.exchange" - le routeur de messages
        // - routingKey : "rental.confirmed" - détermine quelle queue reçoit le message
        // - event : l'objet sera sérialisé en JSON automatiquement
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.RENTAL_EXCHANGE,
                RabbitMQConfig.RENTAL_CONFIRMED_KEY,
                event
        );

        log.info("Rental confirmed event published successfully");
    }

    /**
     * Publie un événement "location annulée" dans RabbitMQ.
     * vehicle-service va consommer ce message et remettre la voiture disponible.
     */
    public void publishRentalCancelled(RentalEvent event) {
        log.info("Publishing rental cancelled event for rental ID: {}", event.getRentalId());

        rabbitTemplate.convertAndSend(
                RabbitMQConfig.RENTAL_EXCHANGE,
                RabbitMQConfig.RENTAL_CANCELLED_KEY,
                event
        );

        log.info("Rental cancelled event published successfully");
    }
}
