package com.dialtec.user_service.mapper;

import com.dialtec.user_service.dto.request.ClientProfileCreationRequest;
import com.dialtec.user_service.dto.request.ClientProfileUpdateRequest;
import com.dialtec.user_service.dto.request.CommercantProfileCreationRequest;
import com.dialtec.user_service.dto.request.CommercantProfileUpdateRequest;
import com.dialtec.user_service.dto.response.ClientProfileResponse;
import com.dialtec.user_service.dto.response.CommercantProfileResponse;
import com.dialtec.user_service.dto.response.PublicCommercantResponse;
import com.dialtec.user_service.entity.CommercantProfile;
import com.dialtec.user_service.entity.UserAccount;
import com.dialtec.user_service.enums.AccountStatus;
import com.dialtec.user_service.enums.Role;
import org.springframework.stereotype.Component;

@Component
public class ProfileMapper {

    // --- Création (reçue via Feign depuis authentication-service) ---

    public UserAccount toUserAccount(CommercantProfileCreationRequest request) {
        return UserAccount.builder()
                .id(request.getUserId())
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(Role.ROLE_CMT)
                .accountStatus(AccountStatus.EN_ATTENTE_VERIFICATION)
                .build();
    }

    public CommercantProfile toCommercantProfile(CommercantProfileCreationRequest request, UserAccount userAccount) {
        return CommercantProfile.builder()
                .userAccount(userAccount)
                .shopCategory(request.getShopCategory())
                .address(request.getAddress())
                .city(request.getCity())
                .postalCode(request.getPostalCode())
                .description(request.getDescription())
                .build();
    }

    public UserAccount toUserAccount(ClientProfileCreationRequest request) {
        return UserAccount.builder()
                .id(request.getUserId())
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(Role.ROLE_CLIENT)
                .accountStatus(AccountStatus.EN_ATTENTE_VERIFICATION)
                .build();
    }

    // --- Réponses (self-service et consultation) ---

    public CommercantProfileResponse toCommercantProfileResponse(UserAccount userAccount, CommercantProfile profile) {
        return CommercantProfileResponse.builder()
                .id(userAccount.getId())
                .email(userAccount.getEmail())
                .fullName(userAccount.getFullName())
                .phoneNumber(userAccount.getPhoneNumber())
                .accountStatus(userAccount.getAccountStatus())
                .shopCategory(profile.getShopCategory())
                .address(profile.getAddress())
                .city(profile.getCity())
                .postalCode(profile.getPostalCode())
                .description(profile.getDescription())
                .createdAt(userAccount.getCreatedAt())
                .build();
    }

    public PublicCommercantResponse toPublicCommercantResponse(CommercantProfile profile) {
        UserAccount userAccount = profile.getUserAccount();
        return PublicCommercantResponse.builder()
                .id(userAccount.getId())
                .fullName(userAccount.getFullName())
                .shopCategory(profile.getShopCategory())
                .phoneNumber(userAccount.getPhoneNumber())
                .address(profile.getAddress())
                .city(profile.getCity())
                .postalCode(profile.getPostalCode())
                .description(profile.getDescription())
                .build();
    }

    public ClientProfileResponse toClientProfileResponse(UserAccount userAccount) {
        return ClientProfileResponse.builder()
                .id(userAccount.getId())
                .email(userAccount.getEmail())
                .fullName(userAccount.getFullName())
                .phoneNumber(userAccount.getPhoneNumber())
                .accountStatus(userAccount.getAccountStatus())
                .createdAt(userAccount.getCreatedAt())
                .build();
    }

    // --- Mise à jour (self-service, mutation directe des entités déjà chargées) ---

    public void applyUpdate(UserAccount userAccount, CommercantProfile profile, CommercantProfileUpdateRequest request) {
        userAccount.setFullName(request.getFullName());
        userAccount.setPhoneNumber(request.getPhoneNumber());
        profile.setShopCategory(request.getShopCategory());
        profile.setAddress(request.getAddress());
        profile.setCity(request.getCity());
        profile.setPostalCode(request.getPostalCode());
        profile.setDescription(request.getDescription());
    }

    public void applyUpdate(UserAccount userAccount, ClientProfileUpdateRequest request) {
        userAccount.setFullName(request.getFullName());
        userAccount.setPhoneNumber(request.getPhoneNumber());
    }
}