package com.dialtec.user_service.controller;

import com.dialtec.user_service.dto.request.ClientProfileUpdateRequest;
import com.dialtec.user_service.dto.response.ClientProfileResponse;
import com.dialtec.user_service.entity.UserAccount;
import com.dialtec.user_service.service.UserAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/client/me")
@RequiredArgsConstructor
public class ClientProfileController {

    private final UserAccountService userAccountService;

    @GetMapping
    public ResponseEntity<ClientProfileResponse> getOwnProfile(@AuthenticationPrincipal UserAccount account) {
        return ResponseEntity.ok(userAccountService.getOwnClientProfile(account.getId()));
    }

    @PutMapping
    public ResponseEntity<ClientProfileResponse> updateOwnProfile(
            @AuthenticationPrincipal UserAccount account,
            @Valid @RequestBody ClientProfileUpdateRequest request) {
        return ResponseEntity.ok(userAccountService.updateOwnClientProfile(account.getId(), request));
    }
}