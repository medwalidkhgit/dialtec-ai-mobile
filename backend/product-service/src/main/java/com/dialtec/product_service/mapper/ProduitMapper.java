package com.dialtec.product_service.mapper;

import com.dialtec.product_service.dto.request.ProduitUpdateRequest;
import com.dialtec.product_service.dto.request.StockUpdateRequest;
import com.dialtec.product_service.dto.response.ProduitImageResponse;
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
                .images(extractOrderedImages(produit))
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
                .images(extractOrderedImages(produit))
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

    /**
     * Normalise la catégorie : espaces superflus retirés, casse uniforme.
     * Évite la fragmentation entre "boissons", "Boissons", "BOISSONS"
     * générées par l'IA à des moments différents pour le même concept.
     */
    public String normalizeCategorie(String categorie) {
        if (categorie == null || categorie.isBlank()) {
            return categorie;
        }
        String trimmed = categorie.trim().toLowerCase();
        return Character.toUpperCase(trimmed.charAt(0)) + trimmed.substring(1);
    }

    /**
     * L'image marquée "principale" apparaît toujours en premier, le reste
     * suit dans l'ordre défini par le commerçant.
     */
    private List<ProduitImageResponse> extractOrderedImages(Produit produit) {
        return produit.getImages().stream()
                .sorted(
                        Comparator.comparing(ProduitImage::isEstPrincipale).reversed()
                                .thenComparing(ProduitImage::getOrdre)
                )
                .map(image -> ProduitImageResponse.builder()
                        .id(image.getId())
                        .imageUrl(image.getImageUrl())
                        .estPrincipale(image.isEstPrincipale())
                        .build())
                .toList();
    }
}