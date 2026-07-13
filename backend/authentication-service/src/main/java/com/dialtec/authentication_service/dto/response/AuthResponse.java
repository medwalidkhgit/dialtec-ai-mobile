package com.dialtec.authentication_service.dto.response;

import com.dialtec.authentication_service.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private UUID id;
    private String email;
    private Role role;
    private String accessToken;
    private String refreshToken;
    private long expiresIn; // durée de validité de l'access token, en secondes
}
