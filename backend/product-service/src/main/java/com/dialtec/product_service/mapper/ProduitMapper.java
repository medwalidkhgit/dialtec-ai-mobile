package com.dialtec.product_service.mapper;

import com.dialtec.product_service.dto.request.ProduitUpdateRequest;
import com.dialtec.product_service.dto.request.StockUpdateRequest;
import com.dialtec.product_service.dto.response.ProduitResponse;
import com.dialtec.product_service.dto.response.PublicProduitResponse;
import com.dialtec.product_service.entity.Produit;
import com.dialtec.product_service.entity.ProduitImage;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class ProduitMapper {

    public ProduitResponse toProduitResponse(Produit produit) {
        return ProduitResponse.builder()
                .id(produit.getId())
                .nom(produit.getNom())
                .description(produit.getDescription())
                .categorie(produit.getCategorie())
                .caracteristiques(produit.getCaracteristiques())
                .prix(produit.getPrix())
                .quantite(produit.getQuantite())
                .seuilAlerte(produit.getSeuilAlerte())
                .stockFaible(produit.getQuantite() <= produit.getSeuilAlerte())
                .statut(produit.getStatut())
                .imageUrls(extractOrderedImageUrls(produit))
                .createdAt(produit.getCreatedAt())
                .build();
    }

    public PublicProduitResponse toPublicProduitResponse(Produit produit) {
        return PublicProduitResponse.builder()
                .id(produit.getId())
                .commercantId(produit.getCommercantId())
                .nom(produit.getNom())
                .description(produit.getDescription())
                .categorie(produit.getCategorie())
                .caracteristiques(produit.getCaracteristiques())
                .prix(produit.getPrix())
                .imageUrls(extractOrderedImageUrls(produit))
                .build();
    }

    public void applyUpdate(Produit produit, ProduitUpdateRequest request) {
        produit.setNom(request.getNom());
        produit.setDescription(request.getDescription());
        produit.setCategorie(normalizeCategorie(request.getCategorie()));
        produit.setCaracteristiques(request.getCaracteristiques());
        produit.setPrix(request.getPrix());
    }

    public void applyStockUpdate(Produit produit, StockUpdateRequest request) {
        produit.setQuantite(request.getQuantite());
        produit.setSeuilAlerte(request.getSeuilAlerte());
    }

    public String normalizeCategorie(String categorie) {
        if (categorie == null || categorie.isBlank()) {
            return categorie;
        }
        String trimmed = categorie.trim().toLowerCase();
        return Character.toUpperCase(trimmed.charAt(0)) + trimmed.substring(1);
    }

    private List<String> extractOrderedImageUrls(Produit produit) {
        return produit.getImages().stream()
                .sorted(
                        Comparator.comparing(ProduitImage::isEstPrincipale).reversed()
                                .thenComparing(ProduitImage::getOrdre)
                )
                .map(ProduitImage::getImageUrl)
                .toList();
    }
}