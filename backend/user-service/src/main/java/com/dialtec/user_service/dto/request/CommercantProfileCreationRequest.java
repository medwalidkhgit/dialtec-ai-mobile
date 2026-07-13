package com.dialtec.user_service.dto.request;

import com.dialtec.user_service.enums.ShopCategory;
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
public class CommercantProfileCreationRequest {

    @NotNull
    private UUID userId;

    @NotBlank
    private String email;

    @NotBlank
    private String fullName;

    @NotNull
    private ShopCategory shopCategory;

    @NotBlank
    private String phoneNumber;

    @NotBlank
    private String address;

    @NotBlank
    private String city;

    @NotBlank
    private String postalCode;

    private String description;
}