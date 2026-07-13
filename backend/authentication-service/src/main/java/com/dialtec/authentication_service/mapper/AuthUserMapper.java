package com.dialtec.authentication_service.mapper;

import com.dialtec.authentication_service.dto.request.RegisterClientRequest;
import com.dialtec.authentication_service.dto.request.RegisterCommercantRequest;
import com.dialtec.authentication_service.dto.response.AuthResponse;
import com.dialtec.authentication_service.entity.AuthUser;
import com.dialtec.authentication_service.enums.Role;
import org.springframework.stereotype.Component;

@Component
public class AuthUserMapper {

    public AuthUser toEntity(RegisterCommercantRequest request, String hashedPassword) {
        return AuthUser.builder()
                .email(request.getEmail())
                .password(hashedPassword)
                .role(Role.ROLE_CMT)
                .build();
    }

    public AuthUser toEntity(RegisterClientRequest request, String hashedPassword) {
        return AuthUser.builder()
                .email(request.getEmail())
                .password(hashedPassword)
                .role(Role.ROLE_CLIENT)
                .build();
    }

    public AuthResponse toAuthResponse(AuthUser authUser, String accessToken, String refreshToken, long expiresIn) {
        return AuthResponse.builder()
                .id(authUser.getId())
                .email(authUser.getEmail())
                .role(authUser.getRole())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(expiresIn)
                .build();
    }
}