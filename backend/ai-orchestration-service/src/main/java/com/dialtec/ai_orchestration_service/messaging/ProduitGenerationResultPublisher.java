package com.dialtec.ai_orchestration_service.messaging;

import com.dialtec.ai_orchestration_service.config.RabbitMQConfig;
import com.dialtec.ai_orchestration_service.dto.FicheGenereeResult;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProduitGenerationResultPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishSuccess(ProduitGenerationRequestMessage request, FicheGenereeResult fiche) {
        ProduitGenerationResultMessage message = ProduitGenerationResultMessage.builder()
                .generationId(request.getGenerationId())
                .commercantId(request.getCommercantId())
                .success(true)
                .photoUrl(request.getPhotoUrl())
                .photoKey(request.getPhotoKey())
                .nom(fiche.getNom())
                .description(fiche.getDescription())
                .categorie(fiche.getCategorie())
                .caracteristiques(fiche.getCaracteristiques())
                .prix(fiche.getPrix())
                .quantite(fiche.getQuantite())
                .build();

        rabbitTemplate.convertAndSend(RabbitMQConfig.GENERATION_RESULT_QUEUE, message);
    }

    public void publishFailure(ProduitGenerationRequestMessage request, String errorMessage) {
        ProduitGenerationResultMessage message = ProduitGenerationResultMessage.builder()
                .generationId(request.getGenerationId())
                .commercantId(request.getCommercantId())
                .success(false)
                .errorMessage(errorMessage)
                .build();

        rabbitTemplate.convertAndSend(RabbitMQConfig.GENERATION_RESULT_QUEUE, message);
    }
}