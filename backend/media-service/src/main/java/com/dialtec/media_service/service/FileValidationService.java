package com.dialtec.media_service.service;

import com.dialtec.media_service.exception.FileTooLargeException;
import com.dialtec.media_service.exception.InvalidFileTypeException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class FileValidationService {

    @Value("${storage.photo.allowed-content-types}")
    private String allowedPhotoTypesCsv;

    @Value("${storage.photo.max-size-bytes}")
    private long maxPhotoSizeBytes;

    @Value("${storage.audio.allowed-content-types}")
    private String allowedAudioTypesCsv;

    @Value("${storage.audio.max-size-bytes}")
    private long maxAudioSizeBytes;

    public void validatePhoto(MultipartFile file) {
        validateType(file, allowedPhotoTypesCsv);
        validateSize(file, maxPhotoSizeBytes);
    }

    public void validateAudio(MultipartFile file) {
        validateType(file, allowedAudioTypesCsv);
        validateSize(file, maxAudioSizeBytes);
    }

    private void validateType(MultipartFile file, String allowedTypesCsv) {
        String contentType = file.getContentType();
        List<String> allowedTypes = List.of(allowedTypesCsv.split(","));

        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new InvalidFileTypeException(
                    "Type de fichier non autorisé : " + contentType + ". Types acceptés : " + allowedTypesCsv);
        }
    }

    private void validateSize(MultipartFile file, long maxSizeBytes) {
        if (file.getSize() > maxSizeBytes) {
            throw new FileTooLargeException(
                    "Fichier trop volumineux (" + file.getSize() + " octets). Maximum autorisé : " + maxSizeBytes + " octets.");
        }
    }
}