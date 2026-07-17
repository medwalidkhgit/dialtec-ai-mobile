package com.dialtec.user_service.controller;

import com.dialtec.user_service.dto.request.CommercantProfileUpdateRequest;
import com.dialtec.user_service.dto.response.CommercantProfileResponse;
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
}