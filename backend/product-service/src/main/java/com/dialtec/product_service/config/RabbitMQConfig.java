package com.dialtec.product_service.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


@Configuration //This is a configuration class managed by Spring Boot
public class RabbitMQConfig {

    public static final String GENERATION_REQUEST_QUEUE = "produit.generation.request"; //The queue name for product-service as a producer and ai-orchestration-service as a consumer (The requests queue)
    public static final String GENERATION_RESULT_QUEUE = "produit.generation.result"; //The queue name for ai-orchestration-service as a producer and product-service as a consumer (The results queue)

    @Bean //The bean managed by Spring Boot for creating the requests queue
    public Queue generationRequestQueue() {
        return new Queue(GENERATION_REQUEST_QUEUE, true); //The queue is durable which means it isn't deleted even if the RabbitMQ server is restarted
    }

    @Bean //The bean managed by Spring Boot for creating the results queue
    public Queue generationResultQueue() {
        return new Queue(GENERATION_RESULT_QUEUE, true); //The queue is durable which means it isn't deleted even if the RabbitMQ server is restarted
    }

    @Bean //The bean managed by Spring Boot for the serialization to JSON object and not to a pure Java object
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}