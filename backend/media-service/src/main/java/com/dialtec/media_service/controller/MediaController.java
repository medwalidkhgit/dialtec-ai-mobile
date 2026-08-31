package com.dialtec.media_service.controller;

import com.dialtec.media_service.dto.response.UploadResponse;
import com.dialtec.media_service.service.FileValidationService;
import com.dialtec.media_service.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class MediaController {

    private final FileValidationService fileValidationService;
    private final StorageService storageService;

    @PostMapping("/api/media/me/photo")
    public ResponseEntity<UploadResponse> uploadPhoto(@RequestParam("file") MultipartFile file) {
        fileValidationService.validatePhoto(file);
        UploadResponse response = storageService.upload(file, "photos");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/api/media/me/audio")
    public ResponseEntity<UploadResponse> uploadAudio(@RequestParam("file") MultipartFile file) {
        fileValidationService.validateAudio(file);
        UploadResponse response = storageService.upload(file, "audio");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Endpoint PUBLIC (sans authentification) qui reservira un fichier
     * déjà uploadé, en le récupérant depuis MinIO en interne au réseau
     * Docker. Volontairement séparé de "/api/media/me" (réservé aux
     * actions authentifiées du commerçant) — un <Image> React Native ne
     * peut pas joindre d'en-tête JWT à une simple URL affichée, donc ce
     * chemin doit rester accessible sans jeton, exactement comme la
     * politique de lecture anonyme déjà configurée directement sur MinIO.
     * "**" capture les clés contenant des "/" (ex: photos/2026-08-30/xxx.jpg).
     */
    @GetMapping("/api/media/file/**")
    public ResponseEntity<byte[]> getFile(jakarta.servlet.http.HttpServletRequest request) {
        String cheminComplet = request.getRequestURI();
        String cle = cheminComplet.substring(cheminComplet.indexOf("/api/media/file/") + "/api/media/file/".length());

        StorageService.DownloadedFile fichier = storageService.download(cle);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fichier.contentType()))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                .body(fichier.bytes());
    }
}