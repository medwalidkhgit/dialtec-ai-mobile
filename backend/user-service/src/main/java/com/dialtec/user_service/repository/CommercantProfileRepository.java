package com.dialtec.user_service.repository;

import com.dialtec.user_service.entity.CommercantProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CommercantProfileRepository extends JpaRepository<CommercantProfile, UUID> {
}