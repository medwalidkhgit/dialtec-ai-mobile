package com.dialtec.media_service.service;

import com.dialtec.media_service.dto.response.UploadResponse;
import com.dialtec.media_service.exception.FileUploadException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3StorageServiceImpl implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(S3StorageServiceImpl.class);

    private final S3Client s3Client;

    @Value("${storage.s3.bucket}")
    private String bucket;

    @Value("${storage.s3.public-url}")
    private String publicUrl;

    @Value("${media.public-url}")
    private String mediaPublicUrl;

    @Override
    public UploadResponse upload(MultipartFile file, String folder) {
        String extension = extractExtension(file.getOriginalFilename());
        String key = folder + "/" + LocalDate.now() + "/" + UUID.randomUUID() + extension;

        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException e) {
            log.error("Échec de l'upload vers le stockage, clé={}", key, e);
            throw new FileUploadException("Impossible d'uploader le fichier, veuillez réessayer.");
        }

        return UploadResponse.builder()
                .key(key)
                // Pointe vers media-service lui-même (déjà confirmé
                // joignable depuis le téléphone), pas directement vers
                // MinIO — évite toute dépendance à l'accessibilité externe
                // du port MinIO, souvent bloqué par pare-feu/WSL2/antivirus
                // sur une machine de développement Windows.
                .url(mediaPublicUrl + "/api/media/file/" + key)
                .build();
    }

    @Override
    public void delete(String key) {
        // Pas de gestion de "fichier introuvable" ici : DeleteObject est
        // idempotent par nature chez S3/MinIO — supprimer une clé qui
        // n'existe pas ou plus renvoie un succès silencieux, pas une
        // erreur. StorageFileNotFoundException reste prévue pour un futur
        // endpoint de consultation, mais n'a pas d'usage ici.
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build());
    }

    @Override
    public DownloadedFile download(String key) {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        try (ResponseInputStream<GetObjectResponse> response = s3Client.getObject(request)) {
            byte[] bytes = response.readAllBytes();
            String contentType = response.response().contentType();
            return new DownloadedFile(bytes, contentType != null ? contentType : "application/octet-stream");
        } catch (IOException e) {
            log.error("Échec de la lecture du fichier depuis le stockage, clé={}", key, e);
            throw new FileUploadException("Impossible de récupérer ce fichier.");
        }
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}