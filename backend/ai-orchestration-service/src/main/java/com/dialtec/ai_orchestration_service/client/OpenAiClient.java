package com.dialtec.ai_orchestration_service.client;

import com.dialtec.ai_orchestration_service.dto.FicheGenereeResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Deux appels distincts vers l'API OpenAI, chacun facturé séparément :
 * transcription (Whisper, facturé à la minute d'audio) puis structuration
 * (GPT-4o, facturé au token, entrée + sortie).
 */
@Component
@Slf4j
public class OpenAiClient {

    private static final String TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";
    private static final String CHAT_URL = "https://api.openai.com/v1/chat/completions";

    private static final String PROMPT_SYSTEME = """
            Tu es un assistant qui aide des commerçants marocains à structurer une fiche produit.
            À partir d'une description vocale transcrite (originellement en darija) et d'une photo,
            génère une fiche produit structurée.
            IMPORTANT : la description transcrite peut être dans n'importe quelle langue
            (darija, français, anglais, arabe ou autre) — quelle que soit la langue
            utilisée par le commerçant, réponds TOUJOURS en français, en traduisant
            naturellement si nécessaire.
            Réponds UNIQUEMENT avec un objet JSON strict, exactement ces champs :
            - nom (string, obligatoire)
            - description (string, obligatoire)
            - categorie (string, obligatoire, un seul mot ou une courte expression)
            - caracteristiques (string ou null si rien de pertinent n'est mentionné)
            - prix (nombre ou null si aucun prix n'est mentionné dans la description)
            - quantite (entier ou null si aucune quantité n'est mentionnée)
            """;

    @Value("${openai.api-key}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 3 tentatives au total, avec un délai croissant entre chaque
     * (1s, puis 2s) — absorbe les erreurs transitoires (réseau, léger
     * pic de charge côté OpenAI) sans relancer indéfiniment sur un
     * fichier réellement inexploitable.
     */
    @Retryable(
            maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2),
            exclude = HttpClientErrorException.class
    )
    public String transcrireAudio(String audioUrl) {
        log.info("URL audio reçue, telle quelle avant tout traitement : [{}]", audioUrl);
        // L'URL reçue est l'URL PUBLIQUE (pensée pour l'affichage côté
        // téléphone) — "localhost" y désigne le conteneur ai-orchestration-
        // service lui-même, jamais MinIO. On la convertit vers le nom du
        // service Docker interne avant de télécharger, même principe que
        // "postgres-auth" ou "rabbitmq" utilisés ailleurs dans ce projet.
        // Regex plutôt qu'un simple remplacement de texte fixe : capture
        // N'IMPORTE QUELLE adresse suivie de :9000 (localhost, une IP
        // locale qui change selon le réseau WiFi, etc.) et la redirige
        // systématiquement vers le nom du service Docker interne — ne
        // casse plus si l'adresse publique change à l'avenir.
        String audioUrlInterne = audioUrl.replaceFirst("://[^/]+:9000", "://minio:9000");
        log.info("URL audio après traitement, utilisée pour le téléchargement : [{}]", audioUrlInterne);

        byte[] audioBytes = restClient.get()
                .uri(audioUrlInterne)
                .retrieve()
                .body(byte[].class);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("model", "gpt-4o-transcribe");
        body.add("file", new ByteArrayResource(audioBytes) {
            @Override
            public String getFilename() {
                return "audio.m4a";
            }
        });

        JsonNode reponse = restClient.post()
                .uri(TRANSCRIPTION_URL)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        String texte = reponse.get("text").asText();
        log.info("Transcription réussie, {} caractères obtenus", texte.length());
        return texte;
    }

    @Retryable(
            maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2),
            exclude = HttpClientErrorException.class
    )
    public FicheGenereeResult genererFiche(String texteTranscrit, String photoUrl) {
        // OpenAI (un serveur externe, sur internet) ne peut jamais atteindre
        // notre réseau Docker local — ni "localhost", ni "minio" ne lui sont
        // accessibles. On télécharge donc la photo NOUS-MÊMES (comme pour
        // l'audio), puis on l'envoie directement encodée dans la requête,
        // plutôt que de lui donner une adresse qu'il ne pourra jamais joindre.
        String photoUrlInterne = photoUrl.replaceFirst("://[^/]+:9000", "://minio:9000");
        byte[] photoBytes = restClient.get()
                .uri(photoUrlInterne)
                .retrieve()
                .body(byte[].class);
        String photoBase64 = Base64.getEncoder().encodeToString(photoBytes);
        String photoDataUri = "data:image/jpeg;base64," + photoBase64;

        Map<String, Object> messageSysteme = Map.of(
                "role", "system",
                "content", PROMPT_SYSTEME
        );

        Map<String, Object> partieTexte = Map.of(
                "type", "text",
                "text", "Description transcrite : " + texteTranscrit
        );
        Map<String, Object> partieImage = Map.of(
                "type", "image_url",
                "image_url", Map.of("url", photoDataUri)
        );
        Map<String, Object> messageUtilisateur = Map.of(
                "role", "user",
                "content", List.of(partieTexte, partieImage)
        );

        Map<String, Object> requestBody = Map.of(
                "model", "gpt-4o",
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(messageSysteme, messageUtilisateur)
        );

        JsonNode reponse = restClient.post()
                .uri(CHAT_URL)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(JsonNode.class);

        String contenuJson = reponse.get("choices").get(0).get("message").get("content").asText();

        try {
            JsonNode fiche = objectMapper.readTree(contenuJson);
            return FicheGenereeResult.builder()
                    .nom(fiche.get("nom").asText())
                    .description(fiche.get("description").asText())
                    .categorie(fiche.get("categorie").asText())
                    .caracteristiques(fiche.hasNonNull("caracteristiques") ? fiche.get("caracteristiques").asText() : null)
                    .prix(fiche.hasNonNull("prix") ? BigDecimal.valueOf(fiche.get("prix").asDouble()) : null)
                    .quantite(fiche.hasNonNull("quantite") ? fiche.get("quantite").asInt() : null)
                    .build();
        } catch (Exception e) {
            log.error("Impossible de parser la réponse JSON de GPT-4o : {}", contenuJson, e);
            throw new IllegalStateException("Réponse GPT-4o inexploitable", e);
        }
    }
}