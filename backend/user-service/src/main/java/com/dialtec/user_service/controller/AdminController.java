package com.dialtec.user_service.controller;

import com.dialtec.user_service.dto.response.AdminStatsResponse;
import com.dialtec.user_service.dto.response.ApiResponse;
import com.dialtec.user_service.dto.response.CommercantProfileResponse;
import com.dialtec.user_service.service.UserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserAccountService userAccountService;

    @GetMapping("/commercants")
    public ResponseEntity<List<CommercantProfileResponse>> listCommercants() {
        return ResponseEntity.ok(userAccountService.listCommercants());
    }

    @GetMapping("/commercants/{userId}")
    public ResponseEntity<CommercantProfileResponse> getCommercantDetails(@PathVariable UUID userId) {
        return ResponseEntity.ok(userAccountService.getCommercantDetails(userId));
    }

    @PatchMapping("/{userId}/block")
    public ResponseEntity<ApiResponse<Void>> blockAccount(@PathVariable UUID userId) {
        userAccountService.blockAccount(userId);
        return ResponseEntity.ok(ApiResponse.success("Compte bloqué."));
    }

    @PatchMapping("/{userId}/unblock")
    public ResponseEntity<ApiResponse<Void>> unblockAccount(@PathVariable UUID userId) {
        userAccountService.unblockAccount(userId);
        return ResponseEntity.ok(ApiResponse.success("Compte débloqué."));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(@PathVariable UUID userId) {
        userAccountService.deleteAccount(userId);
        return ResponseEntity.ok(ApiResponse.success("Compte supprimé."));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(userAccountService.getStats());
    }
}