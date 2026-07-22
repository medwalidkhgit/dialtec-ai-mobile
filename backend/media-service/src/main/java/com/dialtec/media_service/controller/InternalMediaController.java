package com.dialtec.media_service.controller;

import com.dialtec.media_service.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/media/internal")
@RequiredArgsConstructor
public class InternalMediaController {

    private final StorageService storageService;

    @DeleteMapping
    public ResponseEntity<Void> delete(@RequestParam("key") String key) {
        storageService.delete(key);
        return ResponseEntity.noContent().build();
    }
}