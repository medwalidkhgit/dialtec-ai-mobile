package com.dialtec.product_service.dto.response;

import com.dialtec.product_service.enums.StatutFiche;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProduitResponse {

    private UUID id;
    private String nom;
    private String description;
    private String categorie;
    private String caracteristiques;
    private BigDecimal prix;
    private Integer quantite;
    private Integer seuilAlerte;
    private boolean stockFaible; // calculé : quantite <= seuilAlerte
    private StatutFiche statut;
    private List<String> imageUrls;
    private LocalDateTime createdAt;
}