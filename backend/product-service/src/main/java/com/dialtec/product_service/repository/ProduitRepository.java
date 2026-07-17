package com.dialtec.product_service.repository;

import com.dialtec.product_service.entity.Produit;
import com.dialtec.product_service.enums.StatutFiche;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProduitRepository extends JpaRepository<Produit, UUID> {

    Page<Produit> findByCommercantId(UUID commercantId, Pageable pageable);

    Page<Produit> findByCommercantIdAndNomContainingIgnoreCase(UUID commercantId, String nom, Pageable pageable);

    Page<Produit> findByCommercantIdAndCategorieIgnoreCase(UUID commercantId, String categorie, Pageable pageable);

    Page<Produit> findByStatut(StatutFiche statut, Pageable pageable);

    Page<Produit> findByStatutAndNomContainingIgnoreCase(StatutFiche statut, String nom, Pageable pageable);

    Page<Produit> findByStatutAndCategorieIgnoreCase(StatutFiche statut, String categorie, Pageable pageable);
}