package com.dialtec.ai_orchestration_service.service;

import com.dialtec.ai_orchestration_service.client.MediaServiceFeignClient;
import com.dialtec.ai_orchestration_service.client.OpenAiClient;
import com.dialtec.ai_orchestration_service.dto.FicheGenereeResult;
import com.dialtec.ai_orchestration_service.messaging.ProduitGenerationRequestMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class GenerationOrchestrationService {

    private final OpenAiClient openAiClient;
    private final MediaServiceFeignClient mediaServiceFeignClient;

    public FicheGenereeResult orchestrer(ProduitGenerationRequestMessage request) {
        String texteTranscrit;
        try {
            texteTranscrit = openAiClient.transcrireAudio(request.getAudioUrl());
        } finally {
            supprimerAudioEnBestEffort(request.getAudioKey());
        }

        return openAiClient.genererFiche(texteTranscrit, request.getPhotoUrl());
    }

    private void supprimerAudioEnBestEffort(String audioKey) {
        try {
            mediaServiceFeignClient.deleteFile(audioKey);
        } catch (Exception e) {
            log.error("Échec de suppression de l'audio, key={}", audioKey, e);
        }
    }
}