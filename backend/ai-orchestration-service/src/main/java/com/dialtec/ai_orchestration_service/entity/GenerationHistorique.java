package com.dialtec.ai_orchestration_service.entity;

import com.dialtec.ai_orchestration_service.enums.StatutGeneration;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GenerationType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "generation_historique")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerationHistorique {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "generation_id", nullable = false)
    private UUID generationId;

    @Column(name = "commercant_id", nullable = false)
    private UUID commercantId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutGeneration statut;

    @Column(name = "message_erreur", columnDefinition = "TEXT")
    private String messageErreur;

    @Column(name = "duree_audio_secondes")
    private Integer dureeAudioSecondes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}