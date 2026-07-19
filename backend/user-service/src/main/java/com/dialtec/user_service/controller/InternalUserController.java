package com.dialtec.user_service.controller;

import com.dialtec.user_service.dto.request.ClientProfileCreationRequest;
import com.dialtec.user_service.dto.request.CommercantProfileCreationRequest;
import com.dialtec.user_service.enums.AccountStatus;
import com.dialtec.user_service.service.UserAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/users/internal")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserAccountService userAccountService;

    @PostMapping("/profiles/commercant")
    public ResponseEntity<Void> createCommercantProfile(@Valid @RequestBody CommercantProfileCreationRequest request) {
        userAccountService.createCommercantProfile(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/profiles/client")
    public ResponseEntity<Void> createClientProfile(@Valid @RequestBody ClientProfileCreationRequest request) {
        userAccountService.createClientProfile(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<Void> updateAccountStatus(@PathVariable UUID userId, @RequestParam AccountStatus status) {
        userAccountService.updateAccountStatus(userId, status);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteProfile(@PathVariable UUID userId) {
        userAccountService.deleteAccount(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/status")
    public ResponseEntity<AccountStatus> getAccountStatus(@PathVariable UUID userId) {
        return ResponseEntity.ok(userAccountService.getAccountStatus(userId));
    }
}