package com.dialtec.product_service.repository;

import com.dialtec.product_service.entity.ProduitImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProduitImageRepository extends JpaRepository<ProduitImage, UUID> {
}