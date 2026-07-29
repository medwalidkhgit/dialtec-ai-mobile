package com.dialtec.ai_orchestration_service.repository;

import com.dialtec.ai_orchestration_service.entity.GenerationHistorique;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GenerationHistoriqueRepository extends JpaRepository<GenerationHistorique, UUID> {
}