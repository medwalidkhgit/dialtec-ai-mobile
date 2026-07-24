package com.dialtec.user_service.repository;

import com.dialtec.user_service.entity.CommercantProfile;
import com.dialtec.user_service.enums.AccountStatus;
import com.dialtec.user_service.enums.ShopCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CommercantProfileRepository extends JpaRepository<CommercantProfile, UUID> {

    Page<CommercantProfile> findByUserAccount_AccountStatus(AccountStatus status, Pageable pageable);

    Page<CommercantProfile> findByShopCategoryAndUserAccount_AccountStatus(
            ShopCategory shopCategory, AccountStatus status, Pageable pageable);
}