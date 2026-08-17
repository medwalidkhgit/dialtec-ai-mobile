package com.dialtec.authentication_service.service;

import com.dialtec.authentication_service.FeignClient.UserServiceFeignClient;
import com.dialtec.authentication_service.dto.request.ChangeEmailRequest;
import com.dialtec.authentication_service.dto.request.ChangePasswordRequest;
import com.dialtec.authentication_service.dto.request.LoginRequest;
import com.dialtec.authentication_service.dto.request.OtpVerificationRequest;
import com.dialtec.authentication_service.dto.request.RefreshTokenRequest;
import com.dialtec.authentication_service.dto.request.RegisterClientRequest;
import com.dialtec.authentication_service.dto.request.RegisterCommercantRequest;
import com.dialtec.authentication_service.dto.request.ResendOtpRequest;
import com.dialtec.authentication_service.dto.response.ApiResponse;
import com.dialtec.authentication_service.dto.response.AuthResponse;
import com.dialtec.authentication_service.entity.AuthUser;
import com.dialtec.authentication_service.enums.AccountStatus;
import com.dialtec.authentication_service.enums.Role;
import com.dialtec.authentication_service.enums.ShopCategory;
import com.dialtec.authentication_service.exception.AccountBlockedException;
import com.dialtec.authentication_service.exception.AccountNotVerifiedException;
import com.dialtec.authentication_service.exception.InvalidCredentialsException;
import com.dialtec.authentication_service.exception.InvalidOtpException;
import com.dialtec.authentication_service.exception.ProfileCreationException;
import com.dialtec.authentication_service.exception.UserAlreadyExistsException;
import com.dialtec.authentication_service.exception.UserNotFoundException;
import com.dialtec.authentication_service.mapper.AuthUserMapper;
import com.dialtec.authentication_service.repository.AuthUserRepository;
import com.dialtec.authentication_service.repository.OtpRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private AuthUserRepository authUserRepository;
    @Mock
    private OtpRepository otpRepository;
    @Mock
    private AuthUserMapper authUserMapper;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private OtpService otpService;
    @Mock
    private UserServiceFeignClient userServiceFeignClient;

    @InjectMocks
    private AuthServiceImpl authService;

    private AuthUser authUserActif;

    @BeforeEach
    void setUp() {
        authUserActif = AuthUser.builder()
                .id(UUID.randomUUID())
                .email("test@dialtec.ma")
                .password("hash")
                .role(Role.ROLE_CMT)
                .accountStatus(AccountStatus.ACTIF)
                .build();
    }

    @Test
    void registerCommercant_quandEmailExisteDeja_leveUserAlreadyExistsException() {
        RegisterCommercantRequest request = RegisterCommercantRequest.builder()
                .email("existe@dialtec.ma")
                .password("Test1234")
                .build();

        when(authUserRepository.existsByEmail("existe@dialtec.ma")).thenReturn(true);

        assertThatThrownBy(() -> authService.registerCommercant(request))
                .isInstanceOf(UserAlreadyExistsException.class);

        verify(authUserRepository, never()).save(any());
    }

    @Test
    void registerCommercant_quandFeignEchoue_leveProfileCreationExceptionEtNAppellePasOtp() {
        RegisterCommercantRequest request = RegisterCommercantRequest.builder()
                .email("nouveau@dialtec.ma")
                .password("Test1234")
                .fullName("Test")
                .shopCategory(ShopCategory.EPICERIE)
                .phoneNumber("0612345678")
                .address("Rue Test")
                .city("Casablanca")
                .postalCode("20000")
                .build();

        AuthUser nouveauUser = AuthUser.builder()
                .id(UUID.randomUUID())
                .email(request.getEmail())
                .role(Role.ROLE_CMT)
                .accountStatus(AccountStatus.EN_ATTENTE_VERIFICATION)
                .build();

        when(authUserRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hash");
        when(authUserMapper.toEntity(request, "hash")).thenReturn(nouveauUser);
        when(authUserRepository.save(nouveauUser)).thenReturn(nouveauUser);
        doThrow(new RuntimeException("connexion refusée"))
                .when(userServiceFeignClient).createCommercantProfile(any());

        assertThatThrownBy(() -> authService.registerCommercant(request))
                .isInstanceOf(ProfileCreationException.class);

        verify(otpService, never()).generateAndSendOtp(any());
    }

    @Test
    void registerCommercant_quandOtpEchoueApresFeignReussi_declencheLaCompensation() {
        RegisterCommercantRequest request = RegisterCommercantRequest.builder()
                .email("nouveau@dialtec.ma")
                .password("Test1234")
                .fullName("Test")
                .shopCategory(ShopCategory.EPICERIE)
                .phoneNumber("0612345678")
                .address("Rue Test")
                .city("Casablanca")
                .postalCode("20000")
                .build();

        UUID userId = UUID.randomUUID();
        AuthUser nouveauUser = AuthUser.builder()
                .id(userId)
                .email(request.getEmail())
                .role(Role.ROLE_CMT)
                .accountStatus(AccountStatus.EN_ATTENTE_VERIFICATION)
                .build();

        when(authUserRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hash");
        when(authUserMapper.toEntity(request, "hash")).thenReturn(nouveauUser);
        when(authUserRepository.save(nouveauUser)).thenReturn(nouveauUser);
        doThrow(new RuntimeException("Gmail indisponible"))
                .when(otpService).generateAndSendOtp(nouveauUser);

        assertThatThrownBy(() -> authService.registerCommercant(request))
                .isInstanceOf(ProfileCreationException.class);

        // La preuve que la compensation qu'on a construite est bien déclenchée
        verify(userServiceFeignClient, times(1)).deleteProfile(userId);
    }

    @Test
    void login_quandMotDePasseIncorrect_leveInvalidCredentialsException() {
        LoginRequest request = new LoginRequest("test@dialtec.ma", "mauvaisMotDePasse");

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));
        when(passwordEncoder.matches("mauvaisMotDePasse", authUserActif.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void login_quandCompteNonVerifie_leveAccountNotVerifiedException() {
        authUserActif.setAccountStatus(AccountStatus.EN_ATTENTE_VERIFICATION);
        LoginRequest request = new LoginRequest("test@dialtec.ma", "Test1234");

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));
        when(passwordEncoder.matches("Test1234", authUserActif.getPassword())).thenReturn(true);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AccountNotVerifiedException.class);
    }

    @Test
    void login_quandCompteBloque_leveAccountBlockedException() {
        authUserActif.setAccountStatus(AccountStatus.BLOQUE);
        LoginRequest request = new LoginRequest("test@dialtec.ma", "Test1234");

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));
        when(passwordEncoder.matches("Test1234", authUserActif.getPassword())).thenReturn(true);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AccountBlockedException.class);
    }

    @Test
    void login_succes_retourneAuthResponseAvecTokens() {
        LoginRequest request = new LoginRequest("test@dialtec.ma", "Test1234");
        AuthResponse expectedResponse = AuthResponse.builder()
                .id(authUserActif.getId())
                .email(authUserActif.getEmail())
                .accessToken("access-token")
                .refreshToken("refresh-token")
                .expiresIn(1800L)
                .build();

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));
        when(passwordEncoder.matches("Test1234", authUserActif.getPassword())).thenReturn(true);
        when(jwtService.generateAccessToken(authUserActif)).thenReturn("access-token");
        when(jwtService.generateRefreshToken(authUserActif)).thenReturn("refresh-token");
        when(jwtService.getRefreshTokenExpirationMillis()).thenReturn(604800000L);
        when(jwtService.getAccessTokenExpirationMillis()).thenReturn(1800000L);
        when(authUserRepository.save(any())).thenReturn(authUserActif);
        when(authUserMapper.toAuthResponse(authUserActif, "access-token", "refresh-token", 1800L))
                .thenReturn(expectedResponse);

        AuthResponse result = authService.login(request);

        assertThat(result.getAccessToken()).isEqualTo("access-token");
        assertThat(result.getRefreshToken()).isEqualTo("refresh-token");
    }

    // --- registerClient ---

    @Test
    void registerClient_quandEmailExisteDeja_leveUserAlreadyExistsException() {
        RegisterClientRequest request = RegisterClientRequest.builder()
                .email("existe@dialtec.ma")
                .password("Test1234")
                .build();

        when(authUserRepository.existsByEmail("existe@dialtec.ma")).thenReturn(true);

        assertThatThrownBy(() -> authService.registerClient(request))
                .isInstanceOf(UserAlreadyExistsException.class);

        verify(authUserRepository, never()).save(any());
    }

    @Test
    void registerClient_quandFeignEchoue_leveProfileCreationExceptionEtNAppellePasOtp() {
        RegisterClientRequest request = RegisterClientRequest.builder()
                .email("nouveau@dialtec.ma")
                .password("Test1234")
                .fullName("Test Client")
                .phoneNumber("0612345678")
                .build();

        AuthUser nouveauUser = AuthUser.builder()
                .id(UUID.randomUUID())
                .email(request.getEmail())
                .role(Role.ROLE_CLIENT)
                .accountStatus(AccountStatus.EN_ATTENTE_VERIFICATION)
                .build();

        when(authUserRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hash");
        when(authUserMapper.toEntity(request, "hash")).thenReturn(nouveauUser);
        when(authUserRepository.save(nouveauUser)).thenReturn(nouveauUser);
        doThrow(new RuntimeException("connexion refusée"))
                .when(userServiceFeignClient).createClientProfile(any());

        assertThatThrownBy(() -> authService.registerClient(request))
                .isInstanceOf(ProfileCreationException.class);

        verify(otpService, never()).generateAndSendOtp(any());
    }

    @Test
    void registerClient_quandOtpEchoueApresFeignReussi_declencheLaCompensation() {
        RegisterClientRequest request = RegisterClientRequest.builder()
                .email("nouveau@dialtec.ma")
                .password("Test1234")
                .fullName("Test Client")
                .phoneNumber("0612345678")
                .build();

        UUID userId = UUID.randomUUID();
        AuthUser nouveauUser = AuthUser.builder()
                .id(userId)
                .email(request.getEmail())
                .role(Role.ROLE_CLIENT)
                .accountStatus(AccountStatus.EN_ATTENTE_VERIFICATION)
                .build();

        when(authUserRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hash");
        when(authUserMapper.toEntity(request, "hash")).thenReturn(nouveauUser);
        when(authUserRepository.save(nouveauUser)).thenReturn(nouveauUser);
        doThrow(new RuntimeException("Gmail indisponible"))
                .when(otpService).generateAndSendOtp(nouveauUser);

        assertThatThrownBy(() -> authService.registerClient(request))
                .isInstanceOf(ProfileCreationException.class);

        verify(userServiceFeignClient, times(1)).deleteProfile(userId);
    }

    // --- verifyOtp ---

    @Test
    void verifyOtp_quandUtilisateurIntrouvable_leveUserNotFoundException() {
        OtpVerificationRequest request = OtpVerificationRequest.builder()
                .email("inconnu@dialtec.ma")
                .code("123456")
                .build();

        when(authUserRepository.findByEmail("inconnu@dialtec.ma")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyOtp(request))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void verifyOtp_quandCodeInvalide_propageInvalidOtpExceptionEtNActivePasLeCompte() {
        OtpVerificationRequest request = OtpVerificationRequest.builder()
                .email("test@dialtec.ma")
                .code("000000")
                .build();

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));
        doThrow(new InvalidOtpException("Code invalide ou expiré."))
                .when(otpService).verifyOtp(authUserActif, "000000");

        assertThatThrownBy(() -> authService.verifyOtp(request))
                .isInstanceOf(InvalidOtpException.class);

        verify(authUserRepository, never()).save(any());
    }

    @Test
    void verifyOtp_quandSynchronisationEchoue_leveProfileCreationException() {
        authUserActif.setAccountStatus(AccountStatus.EN_ATTENTE_VERIFICATION);
        OtpVerificationRequest request = OtpVerificationRequest.builder()
                .email("test@dialtec.ma")
                .code("123456")
                .build();

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));
        doThrow(new RuntimeException("user-service injoignable"))
                .when(userServiceFeignClient).updateAccountStatus(authUserActif.getId(), AccountStatus.ACTIF);

        assertThatThrownBy(() -> authService.verifyOtp(request))
                .isInstanceOf(ProfileCreationException.class);
    }

    @Test
    void verifyOtp_succes_activeLeCompteEtSynchronise() {
        authUserActif.setAccountStatus(AccountStatus.EN_ATTENTE_VERIFICATION);
        OtpVerificationRequest request = OtpVerificationRequest.builder()
                .email("test@dialtec.ma")
                .code("123456")
                .build();

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));

        ApiResponse<Void> result = authService.verifyOtp(request);

        assertThat(result.isSuccess()).isTrue();
        assertThat(authUserActif.getAccountStatus()).isEqualTo(AccountStatus.ACTIF);
        verify(userServiceFeignClient).updateAccountStatus(authUserActif.getId(), AccountStatus.ACTIF);
    }

    // --- resendOtp ---

    @Test
    void resendOtp_quandUtilisateurIntrouvable_leveUserNotFoundException() {
        ResendOtpRequest request = ResendOtpRequest.builder().email("inconnu@dialtec.ma").build();

        when(authUserRepository.findByEmail("inconnu@dialtec.ma")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.resendOtp(request))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void resendOtp_quandCompteDejaVerifie_leveInvalidOtpException() {
        ResendOtpRequest request = ResendOtpRequest.builder().email("test@dialtec.ma").build();

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));

        assertThatThrownBy(() -> authService.resendOtp(request))
                .isInstanceOf(InvalidOtpException.class);

        verify(otpService, never()).resendOtp(any());
    }

    @Test
    void resendOtp_succes_declencheUnNouvelEnvoi() {
        authUserActif.setAccountStatus(AccountStatus.EN_ATTENTE_VERIFICATION);
        ResendOtpRequest request = ResendOtpRequest.builder().email("test@dialtec.ma").build();

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));

        ApiResponse<Void> result = authService.resendOtp(request);

        assertThat(result.isSuccess()).isTrue();
        verify(otpService).resendOtp(authUserActif);
    }

    // --- refreshToken ---

    @Test
    void refreshToken_quandTokenNeCorrespondPas_leveInvalidCredentialsException() {
        RefreshTokenRequest request = RefreshTokenRequest.builder().refreshToken("mauvais-token").build();
        authUserActif.setRefreshToken("vrai-token-stocke");
        authUserActif.setRefreshTokenExpiry(LocalDateTime.now().plusDays(1));

        when(jwtService.extractEmail("mauvais-token")).thenReturn("test@dialtec.ma");
        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));

        assertThatThrownBy(() -> authService.refreshToken(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void refreshToken_quandTokenExpire_leveInvalidCredentialsException() {
        RefreshTokenRequest request = RefreshTokenRequest.builder().refreshToken("token-stocke").build();
        authUserActif.setRefreshToken("token-stocke");
        authUserActif.setRefreshTokenExpiry(LocalDateTime.now().minusDays(1));

        when(jwtService.extractEmail("token-stocke")).thenReturn("test@dialtec.ma");
        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));

        assertThatThrownBy(() -> authService.refreshToken(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void refreshToken_succes_retourneDeNouveauxTokens() {
        RefreshTokenRequest request = RefreshTokenRequest.builder().refreshToken("token-valide").build();
        authUserActif.setRefreshToken("token-valide");
        authUserActif.setRefreshTokenExpiry(LocalDateTime.now().plusDays(1));

        AuthResponse expectedResponse = AuthResponse.builder()
                .accessToken("nouveau-access")
                .refreshToken("nouveau-refresh")
                .build();

        when(jwtService.extractEmail("token-valide")).thenReturn("test@dialtec.ma");
        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));
        when(jwtService.generateAccessToken(authUserActif)).thenReturn("nouveau-access");
        when(jwtService.generateRefreshToken(authUserActif)).thenReturn("nouveau-refresh");
        when(jwtService.getRefreshTokenExpirationMillis()).thenReturn(604800000L);
        when(jwtService.getAccessTokenExpirationMillis()).thenReturn(1800000L);
        when(authUserRepository.save(any())).thenReturn(authUserActif);
        when(authUserMapper.toAuthResponse(any(), eq("nouveau-access"), eq("nouveau-refresh"), anyLong()))
                .thenReturn(expectedResponse);

        AuthResponse result = authService.refreshToken(request);

        assertThat(result.getAccessToken()).isEqualTo("nouveau-access");
    }

    // --- logout ---

    @Test
    void logout_quandUtilisateurIntrouvable_leveUserNotFoundException() {
        RefreshTokenRequest request = RefreshTokenRequest.builder().refreshToken("token").build();

        when(jwtService.extractEmail("token")).thenReturn("inconnu@dialtec.ma");
        when(authUserRepository.findByEmail("inconnu@dialtec.ma")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.logout(request))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void logout_succes_effaceLeRefreshTokenStocke() {
        RefreshTokenRequest request = RefreshTokenRequest.builder().refreshToken("token").build();
        authUserActif.setRefreshToken("token");
        authUserActif.setRefreshTokenExpiry(LocalDateTime.now().plusDays(1));

        when(jwtService.extractEmail("token")).thenReturn("test@dialtec.ma");
        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));

        authService.logout(request);

        assertThat(authUserActif.getRefreshToken()).isNull();
        assertThat(authUserActif.getRefreshTokenExpiry()).isNull();
    }

    // --- changeEmail ---

    @Test
    void changeEmail_quandMotDePasseIncorrect_leveInvalidCredentialsException() {
        ChangeEmailRequest request = ChangeEmailRequest.builder()
                .currentEmail("test@dialtec.ma")
                .password("mauvais")
                .newEmail("nouveau@dialtec.ma")
                .build();

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));
        when(passwordEncoder.matches("mauvais", authUserActif.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> authService.changeEmail(request))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void changeEmail_quandNouvelEmailDejaPris_leveUserAlreadyExistsException() {
        ChangeEmailRequest request = ChangeEmailRequest.builder()
                .currentEmail("test@dialtec.ma")
                .password("Test1234")
                .newEmail("dejapris@dialtec.ma")
                .build();

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));
        when(passwordEncoder.matches("Test1234", authUserActif.getPassword())).thenReturn(true);
        when(authUserRepository.existsByEmail("dejapris@dialtec.ma")).thenReturn(true);

        assertThatThrownBy(() -> authService.changeEmail(request))
                .isInstanceOf(UserAlreadyExistsException.class);
    }

    @Test
    void changeEmail_succes_remetLeCompteEnAttenteEtSynchronise() {
        ChangeEmailRequest request = ChangeEmailRequest.builder()
                .currentEmail("test@dialtec.ma")
                .password("Test1234")
                .newEmail("nouveau@dialtec.ma")
                .build();

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));
        when(passwordEncoder.matches("Test1234", authUserActif.getPassword())).thenReturn(true);
        when(authUserRepository.existsByEmail("nouveau@dialtec.ma")).thenReturn(false);

        ApiResponse<Void> result = authService.changeEmail(request);

        assertThat(result.isSuccess()).isTrue();
        assertThat(authUserActif.getEmail()).isEqualTo("nouveau@dialtec.ma");
        assertThat(authUserActif.getAccountStatus()).isEqualTo(AccountStatus.EN_ATTENTE_VERIFICATION);
        verify(userServiceFeignClient).updateEmail(authUserActif.getId(), "nouveau@dialtec.ma");
        verify(otpService).generateAndSendOtp(authUserActif);
    }

    // --- changePassword ---

    @Test
    void changePassword_quandAncienMotDePasseIncorrect_leveInvalidCredentialsException() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .email("test@dialtec.ma")
                .oldPassword("mauvais")
                .newPassword("Nouveau1234")
                .build();

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));
        when(passwordEncoder.matches("mauvais", authUserActif.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword(request))
                .isInstanceOf(InvalidCredentialsException.class);

        verify(authUserRepository, never()).save(any());
    }

    @Test
    void changePassword_succes_metAJourLeMotDePasseEncode() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .email("test@dialtec.ma")
                .oldPassword("Test1234")
                .newPassword("Nouveau1234")
                .build();

        when(authUserRepository.findByEmail("test@dialtec.ma")).thenReturn(Optional.of(authUserActif));
        when(passwordEncoder.matches("Test1234", authUserActif.getPassword())).thenReturn(true);
        when(passwordEncoder.encode("Nouveau1234")).thenReturn("nouveau-hash");

        ApiResponse<Void> result = authService.changePassword(request);

        assertThat(result.isSuccess()).isTrue();
        assertThat(authUserActif.getPassword()).isEqualTo("nouveau-hash");
    }
}