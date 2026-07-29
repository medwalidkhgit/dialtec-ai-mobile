package com.dialtec.ai_orchestration_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FicheGenereeResult {

    private String nom;
    private String description;
    private String categorie;
    private String caracteristiques;
    private BigDecimal prix;
    private Integer quantite;
}