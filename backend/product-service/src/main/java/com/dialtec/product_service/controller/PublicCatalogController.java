package com.dialtec.product_service.controller;

import com.dialtec.product_service.dto.response.PublicProduitResponse;
import com.dialtec.product_service.service.ProduitService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/produits/catalogue")
@RequiredArgsConstructor
public class PublicCatalogController {

    private final ProduitService produitService;

    @GetMapping
    public ResponseEntity<Page<PublicProduitResponse>> listerCatalogue(
            @RequestParam(required = false) String nom,
            @RequestParam(required = false) String categorie,
            Pageable pageable) {
        return ResponseEntity.ok(produitService.listerCataloguePublic(nom, categorie, pageable));
    }

    @GetMapping("/commercant/{commercantId}")
    public ResponseEntity<Page<PublicProduitResponse>> listerCatalogueParCommercant(
            @PathVariable UUID commercantId,
            @RequestParam(required = false) String categorie,
            Pageable pageable) {
        return ResponseEntity.ok(produitService.listerCatalogueParCommercant(commercantId, categorie, pageable));
    }

    @GetMapping("/{produitId}")
    public ResponseEntity<PublicProduitResponse> consulterProduit(@PathVariable UUID produitId) {
        return ResponseEntity.ok(produitService.consulterProduitPublic(produitId));
    }
}