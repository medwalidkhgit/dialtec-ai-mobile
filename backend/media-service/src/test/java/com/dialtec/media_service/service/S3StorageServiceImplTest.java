package com.dialtec.media_service.service;

import com.dialtec.media_service.dto.response.UploadResponse;
import com.dialtec.media_service.exception.FileUploadException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class S3StorageServiceImplTest {

    @Mock
    private S3Client s3Client;

    @InjectMocks
    private S3StorageServiceImpl storageService;

    @BeforeEach
    void setUp() {
        // @Value ne s'injecte jamais dans un test unitaire pur (pas de
        // contexte Spring) — sans ça, bucket/publicUrl vaudraient null.
        ReflectionTestUtils.setField(storageService, "bucket", "dialtec-bucket");
        ReflectionTestUtils.setField(storageService, "publicUrl", "http://localhost:9000");
        ReflectionTestUtils.setField(storageService, "mediaPublicUrl", "http://localhost:8087");
    }

    @Test
    void upload_succes_retourneUneCleEtUneUrlConstruites() {
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", "contenu".getBytes());

        UploadResponse result = storageService.upload(file, "produits");

        assertThat(result.getKey()).startsWith("produits/").endsWith(".jpg");
        // Depuis l'introduction du proxy media-service (contournement du
        // blocage iOS sur le chargement d'images en HTTP direct vers
        // MinIO), l'URL construite pointe désormais vers media-service
        // lui-même, pas directement vers MinIO.
        assertThat(result.getUrl()).isEqualTo("http://localhost:8087/api/media/file/" + result.getKey());
    }

    @Test
    void upload_succes_appelleS3ClientAvecLeBonBucketEtLaBonneCle() {
        MockMultipartFile file = new MockMultipartFile("file", "audio.m4a", "audio/mp4", "contenu".getBytes());
        ArgumentCaptor<PutObjectRequest> requestCaptor = ArgumentCaptor.forClass(PutObjectRequest.class);

        UploadResponse result = storageService.upload(file, "audios");

        verify(s3Client).putObject(requestCaptor.capture(), any(software.amazon.awssdk.core.sync.RequestBody.class));
        assertThat(requestCaptor.getValue().bucket()).isEqualTo("dialtec-bucket");
        assertThat(requestCaptor.getValue().key()).isEqualTo(result.getKey());
        assertThat(requestCaptor.getValue().contentType()).isEqualTo("audio/mp4");
    }

    @Test
    void upload_sansNomDeFichierNiExtension_neCassePasEtOmetLExtension() {
        MockMultipartFile file = new MockMultipartFile("file", null, "image/jpeg", "contenu".getBytes());

        UploadResponse result = storageService.upload(file, "produits");

        assertThat(result.getKey()).startsWith("produits/");
        assertThat(result.getKey()).doesNotContain(".jpg");
    }

    @Test
    void upload_quandLectureDuFichierEchoue_leveFileUploadException() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getOriginalFilename()).thenReturn("photo.jpg");
        when(file.getInputStream()).thenThrow(new IOException("flux illisible"));

        assertThatThrownBy(() -> storageService.upload(file, "produits"))
                .isInstanceOf(FileUploadException.class);
    }

    @Test
    void delete_delegueDirectementAuClientS3() {
        ArgumentCaptor<DeleteObjectRequest> requestCaptor = ArgumentCaptor.forClass(DeleteObjectRequest.class);

        storageService.delete("produits/2026-08-17/abc123.jpg");

        verify(s3Client).deleteObject(requestCaptor.capture());
        assertThat(requestCaptor.getValue().bucket()).isEqualTo("dialtec-bucket");
        assertThat(requestCaptor.getValue().key()).isEqualTo("produits/2026-08-17/abc123.jpg");
    }
}