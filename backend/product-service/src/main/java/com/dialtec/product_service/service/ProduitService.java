package com.dialtec.product_service.service;

import com.dialtec.product_service.dto.request.AjouterImageRequest;
import com.dialtec.product_service.dto.request.GenerationRequest;
import com.dialtec.product_service.dto.request.ProduitUpdateRequest;
import com.dialtec.product_service.dto.request.StockUpdateRequest;
import com.dialtec.product_service.dto.response.ProduitResponse;
import com.dialtec.product_service.dto.response.PublicProduitResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProduitService {

    // --- Self-service commerçant ---
    UUID initierGeneration(UUID commercantId, GenerationRequest request);

    ProduitResponse consulterParGenerationId(UUID commercantId, UUID generationId);

    Page<ProduitResponse> listerMesProduits(UUID commercantId, String nom, String categorie, Pageable pageable);

    ProduitResponse consulterMonProduit(UUID commercantId, UUID produitId);

    ProduitResponse modifierMonProduit(UUID commercantId, UUID produitId, ProduitUpdateRequest request);

    ProduitResponse validerMaFiche(UUID commercantId, UUID produitId);

    ProduitResponse mettreAJourStock(UUID commercantId, UUID produitId, StockUpdateRequest request);

    void supprimerMonProduit(UUID commercantId, UUID produitId);

    ProduitResponse ajouterImage(UUID commercantId, UUID produitId, AjouterImageRequest request);

    ProduitResponse supprimerImage(UUID commercantId, UUID produitId, UUID imageId);

    // --- Catalogue public (marketplace) ---
    Page<PublicProduitResponse> listerCataloguePublic(String nom, String categorie, Pageable pageable);

    Page<PublicProduitResponse> listerCatalogueParCommercant(UUID commercantId, String categorie, Pageable pageable);

    PublicProduitResponse consulterProduitPublic(UUID produitId);
}