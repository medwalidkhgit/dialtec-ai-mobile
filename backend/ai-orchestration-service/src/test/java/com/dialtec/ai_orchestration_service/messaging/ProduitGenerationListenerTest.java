package com.dialtec.ai_orchestration_service.messaging;

import com.dialtec.ai_orchestration_service.dto.FicheGenereeResult;
import com.dialtec.ai_orchestration_service.entity.GenerationHistorique;
import com.dialtec.ai_orchestration_service.enums.StatutGeneration;
import com.dialtec.ai_orchestration_service.repository.GenerationHistoriqueRepository;
import com.dialtec.ai_orchestration_service.service.GenerationOrchestrationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProduitGenerationListenerTest {

    @Mock
    private GenerationOrchestrationService generationOrchestrationService;
    @Mock
    private ProduitGenerationResultPublisher resultPublisher;
    @Mock
    private GenerationHistoriqueRepository generationHistoriqueRepository;

    @InjectMocks
    private ProduitGenerationListener listener;

    private ProduitGenerationRequestMessage request;

    @BeforeEach
    void setUp() {
        request = ProduitGenerationRequestMessage.builder()
                .generationId(UUID.randomUUID())
                .commercantId(UUID.randomUUID())
                .photoUrl("photo.jpg")
                .audioUrl("audio.m4a")
                .build();
    }

    @Test
    void handleGenerationRequest_succes_publieLeSuccesEtSauvegardeLHistoriqueEnSucces() {
        FicheGenereeResult fiche = FicheGenereeResult.builder().nom("Détergent multi-usage").build();
        when(generationOrchestrationService.orchestrer(request)).thenReturn(fiche);

        listener.handleGenerationRequest(request);

        verify(resultPublisher).publishSuccess(request, fiche);
        verify(resultPublisher, never()).publishFailure(any(), any());

        ArgumentCaptor<GenerationHistorique> historiqueCaptor = ArgumentCaptor.forClass(GenerationHistorique.class);
        verify(generationHistoriqueRepository).save(historiqueCaptor.capture());
        assertThat(historiqueCaptor.getValue().getStatut()).isEqualTo(StatutGeneration.SUCCES);
        assertThat(historiqueCaptor.getValue().getMessageErreur()).isNull();
        assertThat(historiqueCaptor.getValue().getGenerationId()).isEqualTo(request.getGenerationId());
    }

    @Test
    void handleGenerationRequest_quandOrchestrationEchoue_publieLEchecEtSauvegardeLHistoriqueEnEchecSansPropagerLException() {
        when(generationOrchestrationService.orchestrer(request))
                .thenThrow(new RuntimeException("OpenAI indisponible"));

        // Le listener ne doit JAMAIS relancer l'exception : RabbitMQ
        // retenterait indéfiniment le message sinon. L'échec doit être
        // capturé, publié comme résultat d'échec, puis journalisé.
        listener.handleGenerationRequest(request);

        verify(resultPublisher).publishFailure(request, "OpenAI indisponible");

        ArgumentCaptor<GenerationHistorique> historiqueCaptor = ArgumentCaptor.forClass(GenerationHistorique.class);
        verify(generationHistoriqueRepository).save(historiqueCaptor.capture());
        assertThat(historiqueCaptor.getValue().getStatut()).isEqualTo(StatutGeneration.ECHEC);
        assertThat(historiqueCaptor.getValue().getMessageErreur()).isEqualTo("OpenAI indisponible");
    }
}