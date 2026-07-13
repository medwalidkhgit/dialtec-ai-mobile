package com.dialtec.user_service.dto.response;

import com.dialtec.user_service.enums.AccountStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientProfileResponse {

    private UUID id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private AccountStatus accountStatus;
    private LocalDateTime createdAt;
}