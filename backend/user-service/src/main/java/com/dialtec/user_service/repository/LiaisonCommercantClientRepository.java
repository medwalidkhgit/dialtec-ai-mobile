package com.dialtec.user_service.repository;

import com.dialtec.user_service.entity.LiaisonCommercantClient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LiaisonCommercantClientRepository extends JpaRepository<LiaisonCommercantClient, UUID> {

    List<LiaisonCommercantClient> findByCommercantId(UUID commercantId);

    List<LiaisonCommercantClient> findByClientId(UUID clientId);

    boolean existsByCommercantIdAndClientId(UUID commercantId, UUID clientId);

    void deleteByCommercantIdAndClientId(UUID commercantId, UUID clientId);
}