package com.dialtec.user_service.controller;

import com.dialtec.user_service.dto.request.CommercantProfileUpdateRequest;
import com.dialtec.user_service.dto.response.ClientResumeResponse;
import com.dialtec.user_service.dto.response.CommercantProfileResponse;
import com.dialtec.user_service.entity.UserAccount;
import com.dialtec.user_service.service.UserAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/commercant/me")
@RequiredArgsConstructor
public class CommercantProfileController {

    private final UserAccountService userAccountService;

    @GetMapping
    public ResponseEntity<CommercantProfileResponse> getOwnProfile(@AuthenticationPrincipal UserAccount account) {
        return ResponseEntity.ok(userAccountService.getOwnCommercantProfile(account.getId()));
    }

    @PutMapping
    public ResponseEntity<CommercantProfileResponse> updateOwnProfile(
            @AuthenticationPrincipal UserAccount account,
            @Valid @RequestBody CommercantProfileUpdateRequest request) {
        return ResponseEntity.ok(userAccountService.updateOwnCommercantProfile(account.getId(), request));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteOwnAccount(@AuthenticationPrincipal UserAccount account) {
        userAccountService.deleteAccount(account.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/clients")
    public ResponseEntity<ClientResumeResponse> ajouterClient(
            @AuthenticationPrincipal UserAccount account,
            @RequestParam String email) {
        ClientResumeResponse response = userAccountService.ajouterClient(account.getId(), email);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/clients/{clientId}")
    public ResponseEntity<Void> retirerClient(
            @AuthenticationPrincipal UserAccount account,
            @PathVariable UUID clientId) {
        userAccountService.retirerClient(account.getId(), clientId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/clients")
    public ResponseEntity<List<ClientResumeResponse>> listerMesClients(@AuthenticationPrincipal UserAccount account) {
        return ResponseEntity.ok(userAccountService.listerMesClients(account.getId()));
    }
}