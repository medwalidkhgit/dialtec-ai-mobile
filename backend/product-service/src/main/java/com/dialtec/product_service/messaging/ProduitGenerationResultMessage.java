package com.dialtec.product_service.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProduitGenerationResultMessage {

    private UUID generationId;
    private UUID commercantId;
    private boolean success;
    private String errorMessage;

    private String photoUrl;
    private String photoKey;
    private String nom;
    private String description;
    private String categorie;
    private String caracteristiques;
    private BigDecimal prix;
    private Integer quantite;
}