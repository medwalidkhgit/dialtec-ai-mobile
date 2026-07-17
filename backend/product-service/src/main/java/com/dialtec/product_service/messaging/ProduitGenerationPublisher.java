package com.dialtec.product_service.messaging;

import com.dialtec.product_service.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ProduitGenerationPublisher {

    private final RabbitTemplate rabbitTemplate;

    public UUID publishGenerationRequest(UUID commercantId, String photoUrl, String audioUrl) {
        UUID generationId = UUID.randomUUID();

        ProduitGenerationRequestMessage message = ProduitGenerationRequestMessage.builder()
                .generationId(generationId)
                .commercantId(commercantId)
                .photoUrl(photoUrl)
                .audioUrl(audioUrl)
                .build();

        rabbitTemplate.convertAndSend(RabbitMQConfig.GENERATION_REQUEST_QUEUE, message);

        return generationId;
    }
}