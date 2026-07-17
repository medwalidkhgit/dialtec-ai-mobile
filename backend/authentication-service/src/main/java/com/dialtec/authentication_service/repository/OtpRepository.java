package com.dialtec.authentication_service.repository;

import com.dialtec.authentication_service.entity.AuthUser;
import com.dialtec.authentication_service.entity.Otp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OtpRepository extends JpaRepository<Otp, UUID> {

    Optional<Otp> findTopByAuthUserAndUsedFalseOrderByCreatedAtDesc(AuthUser authUser);

    Optional<Otp> findTopByAuthUserOrderByCreatedAtDesc(AuthUser authUser);

    void deleteByAuthUser(AuthUser authUser);
}