package com.dialtec.user_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GenerationType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "liaison_commercant_client",
        uniqueConstraints = @UniqueConstraint(columnNames = {"commercant_id", "client_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiaisonCommercantClient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "commercant_id", nullable = false)
    private UUID commercantId;

    @Column(name = "client_id", nullable = false)
    private UUID clientId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}