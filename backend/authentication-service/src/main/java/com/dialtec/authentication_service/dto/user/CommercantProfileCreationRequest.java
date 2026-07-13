package com.dialtec.authentication_service.dto.user;

import com.dialtec.authentication_service.enums.ShopCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommercantProfileCreationRequest {

    private UUID userId;
    private String email;
    private String fullName;
    private ShopCategory shopCategory;
    private String phoneNumber;
    private String address;
    private String city;
    private String postalCode;
    private String description;

}
