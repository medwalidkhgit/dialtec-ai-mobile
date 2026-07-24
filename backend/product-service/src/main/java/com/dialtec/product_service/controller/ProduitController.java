package com.dialtec.product_service.controller;

import com.dialtec.product_service.dto.request.AjouterImageRequest;
import com.dialtec.product_service.dto.request.GenerationRequest;
import com.dialtec.product_service.dto.request.ProduitUpdateRequest;
import com.dialtec.product_service.dto.request.StockUpdateRequest;
import com.dialtec.product_service.dto.response.ApiResponse;
import com.dialtec.product_service.dto.response.ProduitResponse;
import com.dialtec.product_service.service.ProduitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/produits/me")
@RequiredArgsConstructor
public class ProduitController {

    private final ProduitService produitService;

    @PostMapping("/generation")
    public ResponseEntity<ApiResponse<UUID>> initierGeneration(
            @AuthenticationPrincipal UUID commercantId,
            @Valid @RequestBody GenerationRequest request) {
        UUID generationId = produitService.initierGeneration(commercantId, request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Génération en cours, la fiche apparaîtra une fois prête.", generationId));
    }

    @GetMapping("/generation/{generationId}")
    public ResponseEntity<ProduitResponse> consulterParGenerationId(
            @AuthenticationPrincipal UUID commercantId,
            @PathVariable UUID generationId) {
        return ResponseEntity.ok(produitService.consulterParGenerationId(commercantId, generationId));
    }

    @GetMapping
    public ResponseEntity<Page<ProduitResponse>> listerMesProduits(
            @AuthenticationPrincipal UUID commercantId,
            @RequestParam(required = false) String nom,
            @RequestParam(required = false) String categorie,
            Pageable pageable) {
        return ResponseEntity.ok(produitService.listerMesProduits(commercantId, nom, categorie, pageable));
    }

    @GetMapping("/{produitId}")
    public ResponseEntity<ProduitResponse> consulterMonProduit(
            @AuthenticationPrincipal UUID commercantId,
            @PathVariable UUID produitId) {
        return ResponseEntity.ok(produitService.consulterMonProduit(commercantId, produitId));
    }

    @PutMapping("/{produitId}")
    public ResponseEntity<ProduitResponse> modifierMonProduit(
            @AuthenticationPrincipal UUID commercantId,
            @PathVariable UUID produitId,
            @Valid @RequestBody ProduitUpdateRequest request) {
        return ResponseEntity.ok(produitService.modifierMonProduit(commercantId, produitId, request));
    }

    @PatchMapping("/{produitId}/valider")
    public ResponseEntity<ProduitResponse> validerMaFiche(
            @AuthenticationPrincipal UUID commercantId,
            @PathVariable UUID produitId) {
        return ResponseEntity.ok(produitService.validerMaFiche(commercantId, produitId));
    }

    @PatchMapping("/{produitId}/stock")
    public ResponseEntity<ProduitResponse> mettreAJourStock(
            @AuthenticationPrincipal UUID commercantId,
            @PathVariable UUID produitId,
            @Valid @RequestBody StockUpdateRequest request) {
        return ResponseEntity.ok(produitService.mettreAJourStock(commercantId, produitId, request));
    }

    @DeleteMapping("/{produitId}")
    public ResponseEntity<Void> supprimerMonProduit(
            @AuthenticationPrincipal UUID commercantId,
            @PathVariable UUID produitId) {
        produitService.supprimerMonProduit(commercantId, produitId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{produitId}/images")
    public ResponseEntity<ProduitResponse> ajouterImage(
            @AuthenticationPrincipal UUID commercantId,
            @PathVariable UUID produitId,
            @Valid @RequestBody AjouterImageRequest request) {
        return ResponseEntity.ok(produitService.ajouterImage(commercantId, produitId, request));
    }

    @DeleteMapping("/{produitId}/images/{imageId}")
    public ResponseEntity<ProduitResponse> supprimerImage(
            @AuthenticationPrincipal UUID commercantId,
            @PathVariable UUID produitId,
            @PathVariable UUID imageId) {
        return ResponseEntity.ok(produitService.supprimerImage(commercantId, produitId, imageId));
    }
}