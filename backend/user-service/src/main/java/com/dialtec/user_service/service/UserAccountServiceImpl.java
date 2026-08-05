package com.dialtec.user_service.service;

import com.dialtec.user_service.client.AuthServiceFeignClient;
import com.dialtec.user_service.dto.request.ClientProfileCreationRequest;
import com.dialtec.user_service.dto.request.ClientProfileUpdateRequest;
import com.dialtec.user_service.dto.request.CommercantProfileCreationRequest;
import com.dialtec.user_service.dto.request.CommercantProfileUpdateRequest;
import com.dialtec.user_service.dto.response.AdminStatsResponse;
import com.dialtec.user_service.dto.response.ClientProfileResponse;
import com.dialtec.user_service.dto.response.ClientResumeResponse;
import com.dialtec.user_service.dto.response.CommercantProfileResponse;
import com.dialtec.user_service.dto.response.PublicCommercantResponse;
import com.dialtec.user_service.entity.CommercantProfile;
import com.dialtec.user_service.entity.LiaisonCommercantClient;
import com.dialtec.user_service.entity.UserAccount;
import com.dialtec.user_service.enums.AccountStatus;
import com.dialtec.user_service.enums.Role;
import com.dialtec.user_service.enums.ShopCategory;
import com.dialtec.user_service.exception.*;
import com.dialtec.user_service.mapper.ProfileMapper;
import com.dialtec.user_service.repository.CommercantProfileRepository;
import com.dialtec.user_service.repository.LiaisonCommercantClientRepository;
import com.dialtec.user_service.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserAccountServiceImpl implements UserAccountService {

    private static final Logger log = LoggerFactory.getLogger(UserAccountServiceImpl.class);

    private final UserAccountRepository userAccountRepository;
    private final CommercantProfileRepository commercantProfileRepository;
    private final LiaisonCommercantClientRepository liaisonCommercantClientRepository;
    private final ProfileMapper profileMapper;
    private final AuthServiceFeignClient authServiceFeignClient;

    @Override
    @Transactional
    public void createCommercantProfile(CommercantProfileCreationRequest request) {
        if (userAccountRepository.existsById(request.getUserId())) {
            throw new ProfileAlreadyExistsException("Un profil existe déjà pour cet utilisateur.");
        }

        UserAccount userAccount = userAccountRepository.save(profileMapper.toUserAccount(request));
        commercantProfileRepository.save(profileMapper.toCommercantProfile(request, userAccount));
    }

    @Override
    @Transactional
    public void createClientProfile(ClientProfileCreationRequest request) {
        if (userAccountRepository.existsById(request.getUserId())) {
            throw new ProfileAlreadyExistsException("Un profil existe déjà pour cet utilisateur.");
        }

        userAccountRepository.save(profileMapper.toUserAccount(request));
    }

    @Override
    @Transactional
    public void updateAccountStatus(UUID userId, AccountStatus status) {
        UserAccount userAccount = findAccountOrThrow(userId);
        userAccount.setAccountStatus(status);
        userAccountRepository.save(userAccount);
    }

    @Override
    public AccountStatus getAccountStatus(UUID userId) {
        return findAccountOrThrow(userId).getAccountStatus();
    }

    @Override
    public CommercantProfileResponse getOwnCommercantProfile(UUID userId) {
        UserAccount userAccount = findAccountOrThrow(userId);
        CommercantProfile profile = findCommercantProfileOrThrow(userId);
        return profileMapper.toCommercantProfileResponse(userAccount, profile);
    }

    @Override
    @Transactional
    public CommercantProfileResponse updateOwnCommercantProfile(UUID userId, CommercantProfileUpdateRequest request) {
        UserAccount userAccount = findAccountOrThrow(userId);
        CommercantProfile profile = findCommercantProfileOrThrow(userId);

        profileMapper.applyUpdate(userAccount, profile, request);
        userAccountRepository.save(userAccount);
        commercantProfileRepository.save(profile);

        return profileMapper.toCommercantProfileResponse(userAccount, profile);
    }

    @Override
    public ClientProfileResponse getOwnClientProfile(UUID userId) {
        UserAccount userAccount = findAccountOrThrow(userId);
        return profileMapper.toClientProfileResponse(userAccount);
    }

    @Override
    @Transactional
    public ClientProfileResponse updateOwnClientProfile(UUID userId, ClientProfileUpdateRequest request) {
        UserAccount userAccount = findAccountOrThrow(userId);
        profileMapper.applyUpdate(userAccount, request);
        userAccountRepository.save(userAccount);
        return profileMapper.toClientProfileResponse(userAccount);
    }

    @Override
    public Page<PublicCommercantResponse> listerCommercantsPublics(ShopCategory shopCategory, Pageable pageable) {
        Page<CommercantProfile> page = (shopCategory != null)
                ? commercantProfileRepository.findByShopCategoryAndUserAccount_AccountStatus(shopCategory, AccountStatus.ACTIF, pageable)
                : commercantProfileRepository.findByUserAccount_AccountStatus(AccountStatus.ACTIF, pageable);

        return page.map(profileMapper::toPublicCommercantResponse);
    }

    @Override
    @Transactional
    public ClientResumeResponse ajouterClient(UUID commercantId, String email) {
        UserAccount client = userAccountRepository.findByEmail(email)
                .filter(account -> account.getRole() == Role.ROLE_CLIENT)
                .orElseThrow(() -> new UserAccountNotFoundException("Aucun client trouvé avec cet email."));

        if (liaisonCommercantClientRepository.existsByCommercantIdAndClientId(commercantId, client.getId())) {
            throw new ClientDejaAjouteException("Ce client a déjà été ajouté.");
        }

        LiaisonCommercantClient liaison = LiaisonCommercantClient.builder()
                .commercantId(commercantId)
                .clientId(client.getId())
                .build();
        liaisonCommercantClientRepository.save(liaison);

        return toClientResumeResponse(client);
    }

    @Override
    @Transactional
    public void retirerClient(UUID commercantId, UUID clientId) {
        liaisonCommercantClientRepository.deleteByCommercantIdAndClientId(commercantId, clientId);
    }

    @Override
    public List<ClientResumeResponse> listerMesClients(UUID commercantId) {
        return liaisonCommercantClientRepository.findByCommercantId(commercantId).stream()
                .map(liaison -> toClientResumeResponse(findAccountOrThrow(liaison.getClientId())))
                .toList();
    }

    @Override
    public List<PublicCommercantResponse> listerMesFournisseurs(UUID clientId) {
        return liaisonCommercantClientRepository.findByClientId(clientId).stream()
                .map(liaison -> profileMapper.toPublicCommercantResponse(
                        findCommercantProfileOrThrow(liaison.getCommercantId())))
                .toList();
    }

    @Override
    public List<UUID> getFournisseurIds(UUID clientId) {
        return liaisonCommercantClientRepository.findByClientId(clientId).stream()
                .map(LiaisonCommercantClient::getCommercantId)
                .toList();
    }

    private ClientResumeResponse toClientResumeResponse(UserAccount client) {
        return ClientResumeResponse.builder()
                .id(client.getId())
                .email(client.getEmail())
                .fullName(client.getFullName())
                .phoneNumber(client.getPhoneNumber())
                .build();
    }

    @Override
    public List<CommercantProfileResponse> listCommercants() {
        return userAccountRepository.findByRole(Role.ROLE_CMT).stream()
                .map(account -> profileMapper.toCommercantProfileResponse(account, findCommercantProfileOrThrow(account.getId())))
                .toList();
    }

    @Override
    public CommercantProfileResponse getCommercantDetails(UUID userId) {
        return getOwnCommercantProfile(userId); // même logique de lecture, réutilisée
    }

    @Override
    @Transactional
    public void blockAccount(UUID userId) {
        UserAccount userAccount = findAccountOrThrow(userId);
        if (userAccount.getRole() == Role.ROLE_ADMIN) {
            throw new UnauthorizedProfileAccessException("Impossible de bloquer un compte administrateur.");
        }
        userAccount.setAccountStatus(AccountStatus.BLOQUE);
        userAccountRepository.save(userAccount);

        try {
            authServiceFeignClient.syncAccountStatus(userId, AccountStatus.BLOQUE);
        } catch (Exception e) {
            log.error("Échec de synchronisation du blocage vers authentication-service, userId={}", userId, e);
            throw new AuthSyncException("Impossible de synchroniser le blocage avec authentication-service, veuillez réessayer.");
        }
    }

    @Override
    @Transactional
    public void unblockAccount(UUID userId) {
        UserAccount userAccount = findAccountOrThrow(userId);
        userAccount.setAccountStatus(AccountStatus.ACTIF);
        userAccountRepository.save(userAccount);

        try {
            authServiceFeignClient.syncAccountStatus(userId, AccountStatus.ACTIF);
        } catch (Exception e) {
            log.error("Échec de synchronisation du déblocage vers authentication-service, userId={}", userId, e);
            throw new AuthSyncException("Impossible de synchroniser le déblocage avec authentication-service, veuillez réessayer.");
        }
    }

    @Override
    @Transactional
    public void deleteAccount(UUID userId) {
        UserAccount userAccount = findAccountOrThrow(userId);
        if (userAccount.getRole() == Role.ROLE_CMT) {
            commercantProfileRepository.deleteById(userId);
        }
        userAccountRepository.delete(userAccount);

        try {
            authServiceFeignClient.deleteAuthUser(userId);
        } catch (Exception e) {
            log.error("Échec de synchronisation de la suppression vers authentication-service, userId={}", userId, e);
            throw new AuthSyncException("Impossible de synchroniser la suppression avec authentication-service, veuillez réessayer.");
        }
    }

    @Override
    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .totalCommercants(userAccountRepository.countByRole(Role.ROLE_CMT))
                .totalClients(userAccountRepository.countByRole(Role.ROLE_CLIENT))
                .totalComptesBloques(userAccountRepository.countByAccountStatus(AccountStatus.BLOQUE))
                .totalComptesEnAttenteVerification(userAccountRepository.countByAccountStatus(AccountStatus.EN_ATTENTE_VERIFICATION))
                .build();
    }

    private UserAccount findAccountOrThrow(UUID userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new UserAccountNotFoundException("Aucun compte trouvé avec cet identifiant."));
    }

    private CommercantProfile findCommercantProfileOrThrow(UUID userId) {
        return commercantProfileRepository.findById(userId)
                .orElseThrow(() -> new UserAccountNotFoundException("Profil boutique introuvable pour ce commerçant."));
    }
}