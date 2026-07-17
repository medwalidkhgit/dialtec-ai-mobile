package com.dialtec.product_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicProduitResponse {

    private UUID id;
    private UUID commercantId;
    private String nom;
    private String description;
    private String categorie;
    private String caracteristiques;
    private BigDecimal prix;
    private List<String> imageUrls;
}