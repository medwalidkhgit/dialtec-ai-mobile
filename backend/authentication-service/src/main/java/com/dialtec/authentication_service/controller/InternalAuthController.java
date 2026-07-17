package com.dialtec.authentication_service.controller;

import com.dialtec.authentication_service.enums.AccountStatus;
import com.dialtec.authentication_service.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth/internal")
@RequiredArgsConstructor
public class InternalAuthController {

    private final AuthService authService;

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteAuthUser(@PathVariable UUID userId) {
        authService.deleteAuthUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<Void> syncAccountStatus(@PathVariable UUID userId, @RequestParam AccountStatus status) {
        authService.syncAccountStatus(userId, status);
        return ResponseEntity.ok().build();
    }
}