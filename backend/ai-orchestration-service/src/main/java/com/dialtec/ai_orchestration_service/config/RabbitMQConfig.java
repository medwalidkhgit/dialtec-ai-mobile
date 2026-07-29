package com.dialtec.ai_orchestration_service.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String GENERATION_REQUEST_QUEUE = "produit.generation.request";
    public static final String GENERATION_RESULT_QUEUE = "produit.generation.result";

    @Bean
    public Queue generationRequestQueue() {
        return new Queue(GENERATION_REQUEST_QUEUE, true);
    }

    @Bean
    public Queue generationResultQueue() {
        return new Queue(GENERATION_RESULT_QUEUE, true);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}