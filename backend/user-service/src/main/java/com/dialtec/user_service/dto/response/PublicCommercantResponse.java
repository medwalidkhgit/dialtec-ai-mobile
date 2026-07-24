package com.dialtec.user_service.dto.response;

import com.dialtec.user_service.enums.ShopCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicCommercantResponse {

    private UUID id;
    private String fullName;
    private ShopCategory shopCategory;
    private String phoneNumber;
    private String address;
    private String city;
    private String postalCode;
    private String description;
}