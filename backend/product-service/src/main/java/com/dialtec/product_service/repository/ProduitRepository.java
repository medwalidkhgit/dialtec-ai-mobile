package com.dialtec.product_service.repository;

import com.dialtec.product_service.entity.Produit;
import com.dialtec.product_service.enums.StatutFiche;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProduitRepository extends JpaRepository<Produit, UUID> {

    Optional<Produit> findByGenerationId(UUID generationId);

    Page<Produit> findByStatutAndCommercantIdIn(StatutFiche statut, List<UUID> commercantIds, Pageable pageable);

    // --- Self-service commerçant (son propre catalogue) ---

    Page<Produit> findByCommercantId(UUID commercantId, Pageable pageable);

    Page<Produit> findByCommercantIdAndNomContainingIgnoreCase(UUID commercantId, String nom, Pageable pageable);

    Page<Produit> findByCommercantIdAndCategorieIgnoreCase(UUID commercantId, String categorie, Pageable pageable);

    // --- Catalogue public (marketplace, clients) — VALIDEE uniquement ---

    Page<Produit> findByStatut(StatutFiche statut, Pageable pageable);

    Page<Produit> findByStatutAndCommercantId(StatutFiche statut, UUID commercantId, Pageable pageable);

    Page<Produit> findByStatutAndCommercantIdAndCategorieIgnoreCase(
            StatutFiche statut, UUID commercantId, String categorie, Pageable pageable);

    Page<Produit> findByStatutAndNomContainingIgnoreCase(StatutFiche statut, String nom, Pageable pageable);

    Page<Produit> findByStatutAndCategorieIgnoreCase(StatutFiche statut, String categorie, Pageable pageable);
}