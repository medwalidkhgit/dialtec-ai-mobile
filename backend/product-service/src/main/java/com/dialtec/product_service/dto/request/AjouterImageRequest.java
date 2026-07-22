package com.dialtec.product_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AjouterImageRequest {

    @NotBlank
    private String imageUrl;

    @NotBlank
    private String imageKey;
}