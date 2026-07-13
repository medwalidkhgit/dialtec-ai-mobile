package com.dialtec.user_service.dto.response;

import com.dialtec.user_service.enums.AccountStatus;
import com.dialtec.user_service.enums.ShopCategory;
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
public class CommercantProfileResponse {

    private UUID id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private AccountStatus accountStatus;
    private ShopCategory shopCategory;
    private String address;
    private String city;
    private String postalCode;
    private String description;
    private LocalDateTime createdAt;
}