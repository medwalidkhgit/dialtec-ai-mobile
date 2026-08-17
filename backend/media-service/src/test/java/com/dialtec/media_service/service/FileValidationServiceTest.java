package com.dialtec.media_service.service;

import com.dialtec.media_service.exception.FileTooLargeException;
import com.dialtec.media_service.exception.InvalidFileTypeException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileValidationServiceTest {

    private FileValidationService fileValidationService;

    @BeforeEach
    void setUp() {
        fileValidationService = new FileValidationService();
        // @Value ne s'injecte jamais dans un test unitaire pur (pas de
        // contexte Spring) — sans ça, tous les seuils vaudraient 0/null.
        ReflectionTestUtils.setField(fileValidationService, "allowedPhotoTypesCsv", "image/jpeg,image/png");
        ReflectionTestUtils.setField(fileValidationService, "maxPhotoSizeBytes", 5_000_000L);
        ReflectionTestUtils.setField(fileValidationService, "allowedAudioTypesCsv", "audio/mp4,audio/mpeg");
        ReflectionTestUtils.setField(fileValidationService, "maxAudioSizeBytes", 10_000_000L);
    }

    // --- validatePhoto ---

    @Test
    void validatePhoto_typeEtTailleAcceptables_nELanceAucuneException() {
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[1000]);

        assertThatCode(() -> fileValidationService.validatePhoto(file)).doesNotThrowAnyException();
    }

    @Test
    void validatePhoto_typeNonAutorise_leveInvalidFileTypeException() {
        MockMultipartFile file = new MockMultipartFile("file", "document.pdf", "application/pdf", new byte[1000]);

        assertThatThrownBy(() -> fileValidationService.validatePhoto(file))
                .isInstanceOf(InvalidFileTypeException.class);
    }

    @Test
    void validatePhoto_contentTypeNull_leveInvalidFileTypeException() {
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", null, new byte[1000]);

        assertThatThrownBy(() -> fileValidationService.validatePhoto(file))
                .isInstanceOf(InvalidFileTypeException.class);
    }

    @Test
    void validatePhoto_tailleDepasseeLeMaximum_leveFileTooLargeException() {
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[6_000_000]);

        assertThatThrownBy(() -> fileValidationService.validatePhoto(file))
                .isInstanceOf(FileTooLargeException.class);
    }

    // --- validateAudio ---

    @Test
    void validateAudio_typeEtTailleAcceptables_nELanceAucuneException() {
        MockMultipartFile file = new MockMultipartFile("file", "audio.m4a", "audio/mp4", new byte[1000]);

        assertThatCode(() -> fileValidationService.validateAudio(file)).doesNotThrowAnyException();
    }

    @Test
    void validateAudio_typeNonAutorise_leveInvalidFileTypeException() {
        MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", new byte[1000]);

        assertThatThrownBy(() -> fileValidationService.validateAudio(file))
                .isInstanceOf(InvalidFileTypeException.class);
    }

    @Test
    void validateAudio_tailleDepasseeLeMaximum_leveFileTooLargeException() {
        MockMultipartFile file = new MockMultipartFile("file", "audio.m4a", "audio/mp4", new byte[11_000_000]);

        assertThatThrownBy(() -> fileValidationService.validateAudio(file))
                .isInstanceOf(FileTooLargeException.class);
    }
}