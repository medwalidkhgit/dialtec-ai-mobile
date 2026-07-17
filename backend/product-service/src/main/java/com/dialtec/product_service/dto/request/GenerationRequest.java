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
public class GenerationRequest {

    @NotBlank
    private String photoUrl;

    @NotBlank
    private String audioUrl;
}