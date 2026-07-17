package com.dialtec.authentication_service.service;

import com.dialtec.authentication_service.dto.request.LoginRequest;
import com.dialtec.authentication_service.dto.request.OtpVerificationRequest;
import com.dialtec.authentication_service.dto.request.RefreshTokenRequest;
import com.dialtec.authentication_service.dto.request.RegisterClientRequest;
import com.dialtec.authentication_service.dto.request.RegisterCommercantRequest;
import com.dialtec.authentication_service.dto.request.ResendOtpRequest;
import com.dialtec.authentication_service.dto.response.ApiResponse;
import com.dialtec.authentication_service.dto.response.AuthResponse;
import com.dialtec.authentication_service.enums.AccountStatus;

import java.util.UUID;

public interface AuthService {

    ApiResponse<Void> registerCommercant(RegisterCommercantRequest request);

    ApiResponse<Void> registerClient(RegisterClientRequest request);

    AuthResponse login(LoginRequest request);

    ApiResponse<Void> verifyOtp(OtpVerificationRequest request);

    ApiResponse<Void> resendOtp(ResendOtpRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    ApiResponse<Void> logout(RefreshTokenRequest request);

    void deleteAuthUser(UUID userId);

    void syncAccountStatus(UUID userId, AccountStatus status);
}