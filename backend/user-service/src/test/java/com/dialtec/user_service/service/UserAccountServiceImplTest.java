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
import com.dialtec.user_service.exception.AuthSyncException;
import com.dialtec.user_service.exception.ClientDejaAjouteException;
import com.dialtec.user_service.exception.ProfileAlreadyExistsException;
import com.dialtec.user_service.exception.UnauthorizedProfileAccessException;
import com.dialtec.user_service.exception.UserAccountNotFoundException;
import com.dialtec.user_service.mapper.ProfileMapper;
import com.dialtec.user_service.repository.CommercantProfileRepository;
import com.dialtec.user_service.repository.LiaisonCommercantClientRepository;
import com.dialtec.user_service.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAccountServiceImplTest {

    @Mock
    private UserAccountRepository userAccountRepository;
    @Mock
    private CommercantProfileRepository commercantProfileRepository;
    @Mock
    private LiaisonCommercantClientRepository liaisonCommercantClientRepository;
    @Mock
    private ProfileMapper profileMapper;
    @Mock
    private AuthServiceFeignClient authServiceFeignClient;

    @InjectMocks
    private UserAccountServiceImpl userAccountService;

    private UUID userId;
    private UserAccount commercantAccount;
    private UserAccount clientAccount;
    private CommercantProfile commercantProfile;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        commercantAccount = UserAccount.builder()
                .id(userId)
                .email("commercant@dialtec.ma")
                .fullName("Commerçant Test")
                .role(Role.ROLE_CMT)
                .accountStatus(AccountStatus.ACTIF)
                .build();
        clientAccount = UserAccount.builder()
                .id(userId)
                .email("client@dialtec.ma")
                .fullName("Client Test")
                .role(Role.ROLE_CLIENT)
                .accountStatus(AccountStatus.ACTIF)
                .build();
        commercantProfile = CommercantProfile.builder()
                .id(userId)
                .userAccount(commercantAccount)
                .shopCategory(ShopCategory.EPICERIE)
                .build();
    }

    // --- createCommercantProfile ---

    @Test
    void createCommercantProfile_quandProfilExisteDeja_leveProfileAlreadyExistsException() {
        CommercantProfileCreationRequest request = CommercantProfileCreationRequest.builder().userId(userId).build();

        when(userAccountRepository.existsById(userId)).thenReturn(true);

        assertThatThrownBy(() -> userAccountService.createCommercantProfile(request))
                .isInstanceOf(ProfileAlreadyExistsException.class);

        verify(userAccountRepository, never()).save(any());
    }

    @Test
    void createCommercantProfile_succes_sauvegardeLeCompteEtLeProfilBoutique() {
        CommercantProfileCreationRequest request = CommercantProfileCreationRequest.builder().userId(userId).build();

        when(userAccountRepository.existsById(userId)).thenReturn(false);
        when(profileMapper.toUserAccount(request)).thenReturn(commercantAccount);
        when(userAccountRepository.save(commercantAccount)).thenReturn(commercantAccount);
        when(profileMapper.toCommercantProfile(request, commercantAccount)).thenReturn(commercantProfile);

        userAccountService.createCommercantProfile(request);

        verify(userAccountRepository).save(commercantAccount);
        verify(commercantProfileRepository).save(commercantProfile);
    }

    // --- createClientProfile ---

    @Test
    void createClientProfile_quandProfilExisteDeja_leveProfileAlreadyExistsException() {
        ClientProfileCreationRequest request = ClientProfileCreationRequest.builder().userId(userId).build();

        when(userAccountRepository.existsById(userId)).thenReturn(true);

        assertThatThrownBy(() -> userAccountService.createClientProfile(request))
                .isInstanceOf(ProfileAlreadyExistsException.class);

        verify(userAccountRepository, never()).save(any());
    }

    @Test
    void createClientProfile_succes_sauvegardeLeCompte() {
        ClientProfileCreationRequest request = ClientProfileCreationRequest.builder().userId(userId).build();

        when(userAccountRepository.existsById(userId)).thenReturn(false);
        when(profileMapper.toUserAccount(request)).thenReturn(clientAccount);

        userAccountService.createClientProfile(request);

        verify(userAccountRepository).save(clientAccount);
    }

    // --- updateAccountStatus ---

    @Test
    void updateAccountStatus_quandCompteIntrouvable_leveUserAccountNotFoundException() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAccountService.updateAccountStatus(userId, AccountStatus.BLOQUE))
                .isInstanceOf(UserAccountNotFoundException.class);
    }

    @Test
    void updateAccountStatus_succes_metAJourLeStatut() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(commercantAccount));

        userAccountService.updateAccountStatus(userId, AccountStatus.BLOQUE);

        assertThat(commercantAccount.getAccountStatus()).isEqualTo(AccountStatus.BLOQUE);
        verify(userAccountRepository).save(commercantAccount);
    }

    // --- updateEmail ---

    @Test
    void updateEmail_quandCompteIntrouvable_leveUserAccountNotFoundException() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAccountService.updateEmail(userId, "nouveau@dialtec.ma"))
                .isInstanceOf(UserAccountNotFoundException.class);
    }

    @Test
    void updateEmail_succes_metAJourLEmail() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(commercantAccount));

        userAccountService.updateEmail(userId, "nouveau@dialtec.ma");

        assertThat(commercantAccount.getEmail()).isEqualTo("nouveau@dialtec.ma");
        verify(userAccountRepository).save(commercantAccount);
    }

    // --- getAccountStatus ---

    @Test
    void getAccountStatus_quandCompteIntrouvable_leveUserAccountNotFoundException() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAccountService.getAccountStatus(userId))
                .isInstanceOf(UserAccountNotFoundException.class);
    }

    @Test
    void getAccountStatus_succes_retourneLeStatut() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(commercantAccount));

        AccountStatus result = userAccountService.getAccountStatus(userId);

        assertThat(result).isEqualTo(AccountStatus.ACTIF);
    }

    // --- getOwnCommercantProfile ---

    @Test
    void getOwnCommercantProfile_quandCompteIntrouvable_leveUserAccountNotFoundException() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAccountService.getOwnCommercantProfile(userId))
                .isInstanceOf(UserAccountNotFoundException.class);
    }

    @Test
    void getOwnCommercantProfile_quandProfilBoutiqueIntrouvable_leveUserAccountNotFoundException() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(commercantAccount));
        when(commercantProfileRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAccountService.getOwnCommercantProfile(userId))
                .isInstanceOf(UserAccountNotFoundException.class);
    }

    @Test
    void getOwnCommercantProfile_succes_retourneLeProfilMappe() {
        CommercantProfileResponse expected = CommercantProfileResponse.builder().id(userId).build();

        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(commercantAccount));
        when(commercantProfileRepository.findById(userId)).thenReturn(Optional.of(commercantProfile));
        when(profileMapper.toCommercantProfileResponse(commercantAccount, commercantProfile)).thenReturn(expected);

        CommercantProfileResponse result = userAccountService.getOwnCommercantProfile(userId);

        assertThat(result).isEqualTo(expected);
    }

    // --- updateOwnCommercantProfile ---

    @Test
    void updateOwnCommercantProfile_succes_appliqueLaMiseAJourEtSauvegarde() {
        CommercantProfileUpdateRequest request = CommercantProfileUpdateRequest.builder().build();
        CommercantProfileResponse expected = CommercantProfileResponse.builder().id(userId).build();

        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(commercantAccount));
        when(commercantProfileRepository.findById(userId)).thenReturn(Optional.of(commercantProfile));
        when(profileMapper.toCommercantProfileResponse(commercantAccount, commercantProfile)).thenReturn(expected);

        CommercantProfileResponse result = userAccountService.updateOwnCommercantProfile(userId, request);

        verify(profileMapper).applyUpdate(commercantAccount, commercantProfile, request);
        verify(userAccountRepository).save(commercantAccount);
        verify(commercantProfileRepository).save(commercantProfile);
        assertThat(result).isEqualTo(expected);
    }

    // --- getOwnClientProfile / updateOwnClientProfile ---

    @Test
    void getOwnClientProfile_quandCompteIntrouvable_leveUserAccountNotFoundException() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAccountService.getOwnClientProfile(userId))
                .isInstanceOf(UserAccountNotFoundException.class);
    }

    @Test
    void getOwnClientProfile_succes_retourneLeProfilMappe() {
        ClientProfileResponse expected = ClientProfileResponse.builder().id(userId).build();

        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(clientAccount));
        when(profileMapper.toClientProfileResponse(clientAccount)).thenReturn(expected);

        ClientProfileResponse result = userAccountService.getOwnClientProfile(userId);

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void updateOwnClientProfile_succes_appliqueLaMiseAJourEtSauvegarde() {
        ClientProfileUpdateRequest request = ClientProfileUpdateRequest.builder().build();
        ClientProfileResponse expected = ClientProfileResponse.builder().id(userId).build();

        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(clientAccount));
        when(profileMapper.toClientProfileResponse(clientAccount)).thenReturn(expected);

        ClientProfileResponse result = userAccountService.updateOwnClientProfile(userId, request);

        verify(profileMapper).applyUpdate(clientAccount, request);
        verify(userAccountRepository).save(clientAccount);
        assertThat(result).isEqualTo(expected);
    }

    // --- listerCommercantsPublics ---

    @Test
    void listerCommercantsPublics_avecCategorie_filtreParCategorie() {
        Pageable pageable = Pageable.unpaged();
        Page<CommercantProfile> page = new PageImpl<>(List.of(commercantProfile));

        when(commercantProfileRepository.findByShopCategoryAndUserAccount_AccountStatus(
                ShopCategory.EPICERIE, AccountStatus.ACTIF, pageable)).thenReturn(page);
        when(profileMapper.toPublicCommercantResponse(commercantProfile))
                .thenReturn(PublicCommercantResponse.builder().id(userId).build());

        Page<PublicCommercantResponse> result = userAccountService.listerCommercantsPublics(ShopCategory.EPICERIE, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(commercantProfileRepository, never()).findByUserAccount_AccountStatus(any(), any());
    }

    @Test
    void listerCommercantsPublics_sansCategorie_retourneTousLesActifs() {
        Pageable pageable = Pageable.unpaged();
        Page<CommercantProfile> page = new PageImpl<>(List.of(commercantProfile));

        when(commercantProfileRepository.findByUserAccount_AccountStatus(AccountStatus.ACTIF, pageable)).thenReturn(page);
        when(profileMapper.toPublicCommercantResponse(commercantProfile))
                .thenReturn(PublicCommercantResponse.builder().id(userId).build());

        Page<PublicCommercantResponse> result = userAccountService.listerCommercantsPublics(null, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    // --- ajouterClient ---

    @Test
    void ajouterClient_quandEmailNeCorrespondPasAUnClient_leveUserAccountNotFoundException() {
        when(userAccountRepository.findByEmail("inconnu@dialtec.ma")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userAccountService.ajouterClient(userId, "inconnu@dialtec.ma"))
                .isInstanceOf(UserAccountNotFoundException.class);
    }

    @Test
    void ajouterClient_quandEmailCorrespondAUnCommercant_leveUserAccountNotFoundException() {
        when(userAccountRepository.findByEmail("commercant@dialtec.ma")).thenReturn(Optional.of(commercantAccount));

        assertThatThrownBy(() -> userAccountService.ajouterClient(userId, "commercant@dialtec.ma"))
                .isInstanceOf(UserAccountNotFoundException.class);
    }

    @Test
    void ajouterClient_quandDejaAjoute_leveClientDejaAjouteException() {
        when(userAccountRepository.findByEmail("client@dialtec.ma")).thenReturn(Optional.of(clientAccount));
        when(liaisonCommercantClientRepository.existsByCommercantIdAndClientId(userId, clientAccount.getId()))
                .thenReturn(true);

        assertThatThrownBy(() -> userAccountService.ajouterClient(userId, "client@dialtec.ma"))
                .isInstanceOf(ClientDejaAjouteException.class);

        verify(liaisonCommercantClientRepository, never()).save(any());
    }

    @Test
    void ajouterClient_succes_creeLaLiaison() {
        when(userAccountRepository.findByEmail("client@dialtec.ma")).thenReturn(Optional.of(clientAccount));
        when(liaisonCommercantClientRepository.existsByCommercantIdAndClientId(userId, clientAccount.getId()))
                .thenReturn(false);

        ClientResumeResponse result = userAccountService.ajouterClient(userId, "client@dialtec.ma");

        assertThat(result.getEmail()).isEqualTo("client@dialtec.ma");
        verify(liaisonCommercantClientRepository).save(any(LiaisonCommercantClient.class));
    }

    // --- retirerClient ---

    @Test
    void retirerClient_delegueAuRepository() {
        UUID clientId = UUID.randomUUID();

        userAccountService.retirerClient(userId, clientId);

        verify(liaisonCommercantClientRepository).deleteByCommercantIdAndClientId(userId, clientId);
    }

    // --- listerMesClients ---

    @Test
    void listerMesClients_retourneLesClientsLiés() {
        LiaisonCommercantClient liaison = LiaisonCommercantClient.builder()
                .commercantId(userId)
                .clientId(clientAccount.getId())
                .build();

        when(liaisonCommercantClientRepository.findByCommercantId(userId)).thenReturn(List.of(liaison));
        when(userAccountRepository.findById(clientAccount.getId())).thenReturn(Optional.of(clientAccount));

        List<ClientResumeResponse> result = userAccountService.listerMesClients(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEmail()).isEqualTo("client@dialtec.ma");
    }

    // --- listerMesFournisseurs ---

    @Test
    void listerMesFournisseurs_retourneLesCommercantsLies() {
        UUID clientId = UUID.randomUUID();
        LiaisonCommercantClient liaison = LiaisonCommercantClient.builder()
                .commercantId(userId)
                .clientId(clientId)
                .build();
        PublicCommercantResponse expected = PublicCommercantResponse.builder().id(userId).build();

        when(liaisonCommercantClientRepository.findByClientId(clientId)).thenReturn(List.of(liaison));
        when(commercantProfileRepository.findById(userId)).thenReturn(Optional.of(commercantProfile));
        when(profileMapper.toPublicCommercantResponse(commercantProfile)).thenReturn(expected);

        List<PublicCommercantResponse> result = userAccountService.listerMesFournisseurs(clientId);

        assertThat(result).containsExactly(expected);
    }

    // --- getFournisseurIds ---

    @Test
    void getFournisseurIds_retourneLesIdsDesCommercantsLies() {
        UUID clientId = UUID.randomUUID();
        LiaisonCommercantClient liaison = LiaisonCommercantClient.builder()
                .commercantId(userId)
                .clientId(clientId)
                .build();

        when(liaisonCommercantClientRepository.findByClientId(clientId)).thenReturn(List.of(liaison));

        List<UUID> result = userAccountService.getFournisseurIds(clientId);

        assertThat(result).containsExactly(userId);
    }

    // --- listCommercants (admin) ---

    @Test
    void listCommercants_retourneTousLesCommercants() {
        CommercantProfileResponse expected = CommercantProfileResponse.builder().id(userId).build();

        when(userAccountRepository.findByRole(Role.ROLE_CMT)).thenReturn(List.of(commercantAccount));
        when(commercantProfileRepository.findById(userId)).thenReturn(Optional.of(commercantProfile));
        when(profileMapper.toCommercantProfileResponse(commercantAccount, commercantProfile)).thenReturn(expected);

        List<CommercantProfileResponse> result = userAccountService.listCommercants();

        assertThat(result).containsExactly(expected);
    }

    // --- blockAccount ---

    @Test
    void blockAccount_quandCompteAdmin_leveUnauthorizedProfileAccessException() {
        UserAccount adminAccount = UserAccount.builder().id(userId).role(Role.ROLE_ADMIN).build();
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(adminAccount));

        assertThatThrownBy(() -> userAccountService.blockAccount(userId))
                .isInstanceOf(UnauthorizedProfileAccessException.class);

        verify(userAccountRepository, never()).save(any());
    }

    @Test
    void blockAccount_quandSynchronisationEchoue_leveAuthSyncExceptionMaisGardeLeBlocageLocal() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(commercantAccount));
        doThrow(new RuntimeException("authentication-service injoignable"))
                .when(authServiceFeignClient).syncAccountStatus(userId, AccountStatus.BLOQUE);

        assertThatThrownBy(() -> userAccountService.blockAccount(userId))
                .isInstanceOf(AuthSyncException.class);

        // Le blocage local reste appliqué même si la synchro échoue —
        // c'est justement pour ça que l'erreur est renvoyée à l'admin,
        // pour qu'il sache que la synchro doit être retentée.
        assertThat(commercantAccount.getAccountStatus()).isEqualTo(AccountStatus.BLOQUE);
    }

    @Test
    void blockAccount_succes_bloqueEtSynchronise() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(commercantAccount));

        userAccountService.blockAccount(userId);

        assertThat(commercantAccount.getAccountStatus()).isEqualTo(AccountStatus.BLOQUE);
        verify(authServiceFeignClient).syncAccountStatus(userId, AccountStatus.BLOQUE);
    }

    // --- unblockAccount ---

    @Test
    void unblockAccount_quandSynchronisationEchoue_leveAuthSyncException() {
        commercantAccount.setAccountStatus(AccountStatus.BLOQUE);
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(commercantAccount));
        doThrow(new RuntimeException("authentication-service injoignable"))
                .when(authServiceFeignClient).syncAccountStatus(userId, AccountStatus.ACTIF);

        assertThatThrownBy(() -> userAccountService.unblockAccount(userId))
                .isInstanceOf(AuthSyncException.class);
    }

    @Test
    void unblockAccount_succes_debloqueEtSynchronise() {
        commercantAccount.setAccountStatus(AccountStatus.BLOQUE);
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(commercantAccount));

        userAccountService.unblockAccount(userId);

        assertThat(commercantAccount.getAccountStatus()).isEqualTo(AccountStatus.ACTIF);
        verify(authServiceFeignClient).syncAccountStatus(userId, AccountStatus.ACTIF);
    }

    // --- deleteAccount ---

    @Test
    void deleteAccount_quandCommercant_supprimeAussiLeProfilBoutique() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(commercantAccount));

        userAccountService.deleteAccount(userId);

        verify(commercantProfileRepository).deleteById(userId);
        verify(userAccountRepository).delete(commercantAccount);
        verify(authServiceFeignClient).deleteAuthUser(userId);
    }

    @Test
    void deleteAccount_quandClient_neSupprimePasDeProfilBoutique() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(clientAccount));

        userAccountService.deleteAccount(userId);

        verify(commercantProfileRepository, never()).deleteById(any());
        verify(userAccountRepository).delete(clientAccount);
    }

    @Test
    void deleteAccount_quandSynchronisationEchoue_leveAuthSyncException() {
        when(userAccountRepository.findById(userId)).thenReturn(Optional.of(clientAccount));
        doThrow(new RuntimeException("authentication-service injoignable"))
                .when(authServiceFeignClient).deleteAuthUser(userId);

        assertThatThrownBy(() -> userAccountService.deleteAccount(userId))
                .isInstanceOf(AuthSyncException.class);
    }

    // --- getStats ---

    @Test
    void getStats_agregeLesComptagesDuRepository() {
        when(userAccountRepository.countByRole(Role.ROLE_CMT)).thenReturn(3L);
        when(userAccountRepository.countByRole(Role.ROLE_CLIENT)).thenReturn(7L);
        when(userAccountRepository.countByAccountStatus(AccountStatus.BLOQUE)).thenReturn(1L);
        when(userAccountRepository.countByAccountStatus(AccountStatus.EN_ATTENTE_VERIFICATION)).thenReturn(2L);

        AdminStatsResponse result = userAccountService.getStats();

        assertThat(result.getTotalCommercants()).isEqualTo(3L);
        assertThat(result.getTotalClients()).isEqualTo(7L);
        assertThat(result.getTotalComptesBloques()).isEqualTo(1L);
        assertThat(result.getTotalComptesEnAttenteVerification()).isEqualTo(2L);
    }
}