package com.dialtec.user_service.service;

import com.dialtec.user_service.dto.request.ClientProfileCreationRequest;
import com.dialtec.user_service.dto.request.ClientProfileUpdateRequest;
import com.dialtec.user_service.dto.request.CommercantProfileCreationRequest;
import com.dialtec.user_service.dto.request.CommercantProfileUpdateRequest;
import com.dialtec.user_service.dto.response.AdminStatsResponse;
import com.dialtec.user_service.dto.response.ClientProfileResponse;
import com.dialtec.user_service.dto.response.CommercantProfileResponse;
import com.dialtec.user_service.dto.response.ClientResumeResponse;
import com.dialtec.user_service.dto.response.PublicCommercantResponse;
import com.dialtec.user_service.enums.AccountStatus;
import com.dialtec.user_service.enums.ShopCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface UserAccountService {

    // --- Appelées via Feign depuis authentication-service ---
    void createCommercantProfile(CommercantProfileCreationRequest request);

    void createClientProfile(ClientProfileCreationRequest request);

    void updateAccountStatus(UUID userId, AccountStatus status);

    void updateEmail(UUID userId, String email);

    AccountStatus getAccountStatus(UUID userId);

    // --- Self-service commerçant ---
    CommercantProfileResponse getOwnCommercantProfile(UUID userId);

    CommercantProfileResponse updateOwnCommercantProfile(UUID userId, CommercantProfileUpdateRequest request);

    // --- Self-service client ---
    ClientProfileResponse getOwnClientProfile(UUID userId);

    ClientProfileResponse updateOwnClientProfile(UUID userId, ClientProfileUpdateRequest request);

    // --- Navigation publique (clients) ---
    Page<PublicCommercantResponse> listerCommercantsPublics(ShopCategory shopCategory, Pageable pageable);

    // --- Liaison commerçant-client ---
    ClientResumeResponse ajouterClient(UUID commercantId, String email);

    void retirerClient(UUID commercantId, UUID clientId);

    List<ClientResumeResponse> listerMesClients(UUID commercantId);

    List<PublicCommercantResponse> listerMesFournisseurs(UUID clientId);

    List<UUID> getFournisseurIds(UUID clientId);

    // --- Espace admin ---
    List<CommercantProfileResponse> listCommercants();

    CommercantProfileResponse getCommercantDetails(UUID userId);

    void blockAccount(UUID userId);

    void unblockAccount(UUID userId);

    void deleteAccount(UUID userId);

    AdminStatsResponse getStats();
}