package com.dialtec.media_service.controller;

import com.dialtec.media_service.dto.response.UploadResponse;
import com.dialtec.media_service.service.FileValidationService;
import com.dialtec.media_service.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/media/me")
@RequiredArgsConstructor
public class MediaController {

    private final FileValidationService fileValidationService;
    private final StorageService storageService;

    @PostMapping("/photo")
    public ResponseEntity<UploadResponse> uploadPhoto(@RequestParam("file") MultipartFile file) {
        fileValidationService.validatePhoto(file);
        UploadResponse response = storageService.upload(file, "photos");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/audio")
    public ResponseEntity<UploadResponse> uploadAudio(@RequestParam("file") MultipartFile file) {
        fileValidationService.validateAudio(file);
        UploadResponse response = storageService.upload(file, "audio");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}