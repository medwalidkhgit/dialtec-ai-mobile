package com.dialtec.user_service.service;

import com.dialtec.user_service.dto.request.ClientProfileCreationRequest;
import com.dialtec.user_service.dto.request.ClientProfileUpdateRequest;
import com.dialtec.user_service.dto.request.CommercantProfileCreationRequest;
import com.dialtec.user_service.dto.request.CommercantProfileUpdateRequest;
import com.dialtec.user_service.dto.response.AdminStatsResponse;
import com.dialtec.user_service.dto.response.ClientProfileResponse;
import com.dialtec.user_service.dto.response.CommercantProfileResponse;
import com.dialtec.user_service.enums.AccountStatus;

import java.util.List;
import java.util.UUID;

public interface UserAccountService {

    void createCommercantProfile(CommercantProfileCreationRequest request);

    void createClientProfile(ClientProfileCreationRequest request);

    void updateAccountStatus(UUID userId, AccountStatus status);

    CommercantProfileResponse getOwnCommercantProfile(UUID userId);

    CommercantProfileResponse updateOwnCommercantProfile(UUID userId, CommercantProfileUpdateRequest request);

    ClientProfileResponse getOwnClientProfile(UUID userId);

    ClientProfileResponse updateOwnClientProfile(UUID userId, ClientProfileUpdateRequest request);

    List<CommercantProfileResponse> listCommercants();

    CommercantProfileResponse getCommercantDetails(UUID userId);

    void blockAccount(UUID userId);

    void unblockAccount(UUID userId);

    void deleteAccount(UUID userId);

    AdminStatsResponse getStats();
}