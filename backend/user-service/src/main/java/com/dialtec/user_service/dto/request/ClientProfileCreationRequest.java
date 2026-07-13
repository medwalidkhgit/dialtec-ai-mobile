package com.dialtec.user_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientProfileCreationRequest {

    @NotNull
    private UUID userId;

    @NotBlank
    private String email;

    @NotBlank
    private String fullName;

    @NotBlank
    private String phoneNumber;
}