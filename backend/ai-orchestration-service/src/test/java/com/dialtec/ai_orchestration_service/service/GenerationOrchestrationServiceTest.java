package com.dialtec.ai_orchestration_service.service;

import com.dialtec.ai_orchestration_service.client.MediaServiceFeignClient;
import com.dialtec.ai_orchestration_service.client.OpenAiClient;
import com.dialtec.ai_orchestration_service.dto.FicheGenereeResult;
import com.dialtec.ai_orchestration_service.messaging.ProduitGenerationRequestMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GenerationOrchestrationServiceTest {

    @Mock
    private OpenAiClient openAiClient;
    @Mock
    private MediaServiceFeignClient mediaServiceFeignClient;

    @InjectMocks
    private GenerationOrchestrationService orchestrationService;

    private ProduitGenerationRequestMessage request;

    @BeforeEach
    void setUp() {
        request = ProduitGenerationRequestMessage.builder()
                .generationId(UUID.randomUUID())
                .commercantId(UUID.randomUUID())
                .photoUrl("photo.jpg")
                .photoKey("photo-key")
                .audioUrl("audio.m4a")
                .audioKey("audio-key")
                .build();
    }

    @Test
    void orchestrer_succes_transcritPuisGenereLaFicheEtSupprimeLAudio() {
        FicheGenereeResult expected = FicheGenereeResult.builder().nom("Détergent multi-usage").build();

        when(openAiClient.transcrireAudio("audio.m4a")).thenReturn("texte transcrit en darija");
        when(openAiClient.genererFiche("texte transcrit en darija", "photo.jpg")).thenReturn(expected);

        FicheGenereeResult result = orchestrationService.orchestrer(request);

        assertThat(result).isEqualTo(expected);
        verify(mediaServiceFeignClient).deleteFile("audio-key");
    }

    @Test
    void orchestrer_quandTranscriptionEchoue_supprimeQuandMemeLAudioAvantDePropager() {
        // Le point le plus important à vérifier ici : le try/finally garantit
        // la suppression de l'audio même si transcrireAudio() lève une
        // exception — exigence de confidentialité, indépendante du succès.
        when(openAiClient.transcrireAudio("audio.m4a")).thenThrow(new RuntimeException("OpenAI indisponible"));

        assertThatThrownBy(() -> orchestrationService.orchestrer(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("OpenAI indisponible");

        verify(mediaServiceFeignClient).deleteFile("audio-key");
    }

    @Test
    void orchestrer_quandSuppressionAudioEchoue_neBloquePasLeResultatDeGeneration() {
        // Best-effort documenté dans le code : un échec de suppression ne
        // doit jamais empêcher la génération de la fiche de se terminer,
        // ni faire planter l'orchestration.
        FicheGenereeResult expected = FicheGenereeResult.builder().nom("Détergent multi-usage").build();

        when(openAiClient.transcrireAudio("audio.m4a")).thenReturn("texte transcrit");
        doThrow(new RuntimeException("media-service injoignable"))
                .when(mediaServiceFeignClient).deleteFile("audio-key");
        when(openAiClient.genererFiche("texte transcrit", "photo.jpg")).thenReturn(expected);

        FicheGenereeResult result = orchestrationService.orchestrer(request);

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void orchestrer_quandGenerationFicheEchoue_lAudioAEteSupprimeAvantMemeCetAppel() {
        when(openAiClient.transcrireAudio("audio.m4a")).thenReturn("texte transcrit");
        when(openAiClient.genererFiche("texte transcrit", "photo.jpg"))
                .thenThrow(new RuntimeException("format de réponse OpenAI invalide"));

        assertThatThrownBy(() -> orchestrationService.orchestrer(request))
                .isInstanceOf(RuntimeException.class);

        // La suppression audio se fait dans le try/finally qui entoure
        // UNIQUEMENT transcrireAudio() — elle a donc déjà eu lieu avant
        // même que genererFiche() ne soit appelée.
        verify(mediaServiceFeignClient).deleteFile("audio-key");
    }
}