package com.dialtec.ai_orchestration_service.messaging;

import com.dialtec.ai_orchestration_service.dto.FicheGenereeResult;
import com.dialtec.ai_orchestration_service.entity.GenerationHistorique;
import com.dialtec.ai_orchestration_service.enums.StatutGeneration;
import com.dialtec.ai_orchestration_service.repository.GenerationHistoriqueRepository;
import com.dialtec.ai_orchestration_service.service.GenerationOrchestrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import static com.dialtec.ai_orchestration_service.config.RabbitMQConfig.GENERATION_REQUEST_QUEUE;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProduitGenerationListener {

    private final GenerationOrchestrationService generationOrchestrationService;
    private final ProduitGenerationResultPublisher resultPublisher;
    private final GenerationHistoriqueRepository generationHistoriqueRepository;

    @RabbitListener(queues = GENERATION_REQUEST_QUEUE)
    public void handleGenerationRequest(ProduitGenerationRequestMessage request) {
        try {
            FicheGenereeResult fiche = generationOrchestrationService.orchestrer(request);

            resultPublisher.publishSuccess(request, fiche);
            saveHistorique(request, StatutGeneration.SUCCES, null);

            log.info("Génération réussie, generationId={}", request.getGenerationId());
        } catch (Exception e) {
            log.error("Échec de génération IA, generationId={}, commercantId={}",
                    request.getGenerationId(), request.getCommercantId(), e);

            resultPublisher.publishFailure(request, e.getMessage());
            saveHistorique(request, StatutGeneration.ECHEC, e.getMessage());
        }
    }

    private void saveHistorique(ProduitGenerationRequestMessage request, StatutGeneration statut, String erreur) {
        GenerationHistorique historique = GenerationHistorique.builder()
                .generationId(request.getGenerationId())
                .commercantId(request.getCommercantId())
                .statut(statut)
                .messageErreur(erreur)
                .build();
        generationHistoriqueRepository.save(historique);
    }
}