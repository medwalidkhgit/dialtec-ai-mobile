package com.dialtec.authentication_service.dto.user;

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

    private UUID userId;
    private String email;
    private String fullName;
    private String phoneNumber;
}