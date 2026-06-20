package com.carrental.rental.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration de RabbitMQ.
 *
 * Concepts clés à retenir pour la prof :
 *
 * EXCHANGE : reçoit les messages et les distribue aux queues selon des règles.
 *            C'est comme un routeur de messages.
 *
 * QUEUE : file d'attente qui stocke les messages jusqu'à ce qu'un consumer les lise.
 *
 * BINDING : lie une queue à un exchange avec une routing key.
 *           Quand un message arrive avec cette routing key → il va dans cette queue.
 *
 * ROUTING KEY : clé de routage. Détermine vers quelle queue va le message.
 *
 * Scénario dans notre app :
 * rental-service publie "rental.confirmed" → Exchange → Queue "rental-confirmed-queue"
 * → vehicle-service consomme et met à jour la dispo de la voiture
 */
@Configuration
public class RabbitMQConfig {

    // Noms des exchanges, queues et routing keys
    public static final String RENTAL_EXCHANGE = "rental.exchange";
    public static final String RENTAL_CONFIRMED_QUEUE = "rental-confirmed-queue";
    public static final String RENTAL_CANCELLED_QUEUE = "rental-cancelled-queue";
    public static final String RENTAL_CONFIRMED_KEY = "rental.confirmed";
    public static final String RENTAL_CANCELLED_KEY = "rental.cancelled";

    /**
     * Exchange de type "Topic" : le routage se fait par pattern sur la routing key.
     * Ex: "rental.*" capture "rental.confirmed" et "rental.cancelled"
     */
    @Bean
    public TopicExchange rentalExchange() {
        return new TopicExchange(RENTAL_EXCHANGE);
    }

    // Queue pour les confirmations de location
    @Bean
    public Queue rentalConfirmedQueue() {
        return new Queue(RENTAL_CONFIRMED_QUEUE, true); // true = durable (survit au redémarrage)
    }

    // Queue pour les annulations de location
    @Bean
    public Queue rentalCancelledQueue() {
        return new Queue(RENTAL_CANCELLED_QUEUE, true);
    }

    // Binding : relie la queue "confirmed" à l'exchange avec la routing key "rental.confirmed"
    @Bean
    public Binding bindingConfirmed(Queue rentalConfirmedQueue, TopicExchange rentalExchange) {
        return BindingBuilder.bind(rentalConfirmedQueue)
                .to(rentalExchange)
                .with(RENTAL_CONFIRMED_KEY);
    }

    // Binding : relie la queue "cancelled" à l'exchange avec la routing key "rental.cancelled"
    @Bean
    public Binding bindingCancelled(Queue rentalCancelledQueue, TopicExchange rentalExchange) {
        return BindingBuilder.bind(rentalCancelledQueue)
                .to(rentalExchange)
                .with(RENTAL_CANCELLED_KEY);
    }

    /**
     * Convertisseur JSON : sérialise/désérialise les messages en JSON.
     * Sans ça, RabbitMQ utilise la sérialisation Java native (binaire, illisible).
     * Avec JSON, les messages sont lisibles et interopérables entre différentes technologies.
     */
    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    // Configure RabbitTemplate pour utiliser le convertisseur JSON
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }
}
