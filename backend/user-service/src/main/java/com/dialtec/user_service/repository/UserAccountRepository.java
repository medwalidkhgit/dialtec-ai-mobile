package com.dialtec.user_service.repository;

import com.dialtec.user_service.entity.UserAccount;
import com.dialtec.user_service.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID> {

    Optional<UserAccount> findByEmail(String email);

    boolean existsByEmail(String email);

    List<UserAccount> findByRole(Role role);

    long countByRole(Role role);
}