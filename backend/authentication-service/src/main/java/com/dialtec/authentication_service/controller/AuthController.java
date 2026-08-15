package com.dialtec.authentication_service.controller;

import com.dialtec.authentication_service.dto.request.ChangeEmailRequest;
import com.dialtec.authentication_service.dto.request.ChangePasswordRequest;
import com.dialtec.authentication_service.dto.request.LoginRequest;
import com.dialtec.authentication_service.dto.request.OtpVerificationRequest;
import com.dialtec.authentication_service.dto.request.RefreshTokenRequest;
import com.dialtec.authentication_service.dto.request.RegisterClientRequest;
import com.dialtec.authentication_service.dto.request.RegisterCommercantRequest;
import com.dialtec.authentication_service.dto.request.ResendOtpRequest;
import com.dialtec.authentication_service.dto.response.ApiResponse;
import com.dialtec.authentication_service.dto.response.AuthResponse;
import com.dialtec.authentication_service.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/commercant")
    public ResponseEntity<ApiResponse<Void>> registerCommercant(@Valid @RequestBody RegisterCommercantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerCommercant(request));
    }

    @PostMapping("/register/client")
    public ResponseEntity<ApiResponse<Void>> registerClient(@Valid @RequestBody RegisterClientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerClient(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody OtpVerificationRequest request) {
        return ResponseEntity.ok(authService.verifyOtp(request));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        return ResponseEntity.ok(authService.resendOtp(request));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.logout(request));
    }

    @PatchMapping("/change-email")
    public ResponseEntity<ApiResponse<Void>> changeEmail(@Valid @RequestBody ChangeEmailRequest request) {
        return ResponseEntity.ok(authService.changeEmail(request));
    }

    @PatchMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(authService.changePassword(request));
    }
}