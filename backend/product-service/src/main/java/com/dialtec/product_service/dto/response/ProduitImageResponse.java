package com.dialtec.product_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProduitImageResponse {

    private UUID id;
    private String imageUrl;
    private boolean estPrincipale;
}