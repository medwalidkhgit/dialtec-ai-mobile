package com.dialtec.user_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientResumeResponse {

    private UUID id;
    private String email;
    private String fullName;
    private String phoneNumber;
}