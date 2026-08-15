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
import com.dialtec.authentication_service.dto.user.ClientProfileCreationRequest;
import com.dialtec.authentication_service.dto.user.CommercantProfileCreationRequest;
import com.dialtec.authentication_service.entity.AuthUser;
import com.dialtec.authentication_service.enums.AccountStatus;
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
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final AuthUserRepository authUserRepository;
    private final OtpRepository otpRepository;
    private final AuthUserMapper authUserMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final UserServiceFeignClient userServiceFeignClient;

    @Override
    @Transactional
    public ApiResponse<Void> registerCommercant(RegisterCommercantRequest request) {
        if (authUserRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Un compte existe déjà avec cet email.");
        }

        AuthUser authUser = authUserMapper.toEntity(request, passwordEncoder.encode(request.getPassword()));
        authUser = authUserRepository.save(authUser);

        try {
            CommercantProfileCreationRequest profileRequest = CommercantProfileCreationRequest.builder()
                    .userId(authUser.getId())
                    .email(authUser.getEmail())
                    .fullName(request.getFullName())
                    .shopCategory(request.getShopCategory())
                    .phoneNumber(request.getPhoneNumber())
                    .address(request.getAddress())
                    .city(request.getCity())
                    .postalCode(request.getPostalCode())
                    .description(request.getDescription())
                    .build();
            userServiceFeignClient.createCommercantProfile(profileRequest);
        } catch (Exception e) {
            throw new ProfileCreationException("Impossible de créer le profil commerçant, veuillez réessayer.");
        }

        // Le profil user-service existe déjà et est déjà commité à ce stade
        // (transaction indépendante, terminée). Si l'envoi d'OTP échoue ici,
        // @Transactional annule bien la partie locale (AuthUser), mais ne
        // peut rien faire côté user-service — d'où la compensation manuelle
        // explicite ci-dessous.
        try {
            otpService.generateAndSendOtp(authUser);
        } catch (Exception e) {
            compensateProfileCreation(authUser.getId());
            throw new ProfileCreationException("Compte créé mais échec de l'envoi du code de vérification, veuillez réessayer.");
        }

        return ApiResponse.success("Compte créé avec succès. Un code de vérification a été envoyé par email.");
    }

    @Override
    @Transactional
    public ApiResponse<Void> registerClient(RegisterClientRequest request) {
        if (authUserRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Un compte existe déjà avec cet email.");
        }

        AuthUser authUser = authUserMapper.toEntity(request, passwordEncoder.encode(request.getPassword()));
        authUser = authUserRepository.save(authUser);

        try {
            ClientProfileCreationRequest profileRequest = ClientProfileCreationRequest.builder()
                    .userId(authUser.getId())
                    .email(authUser.getEmail())
                    .fullName(request.getFullName())
                    .phoneNumber(request.getPhoneNumber())
                    .build();
            userServiceFeignClient.createClientProfile(profileRequest);
        } catch (Exception e) {
            throw new ProfileCreationException("Impossible de créer le profil client, veuillez réessayer.");
        }

        try {
            otpService.generateAndSendOtp(authUser);
        } catch (Exception e) {
            compensateProfileCreation(authUser.getId());
            throw new ProfileCreationException("Compte créé mais échec de l'envoi du code de vérification, veuillez réessayer.");
        }

        return ApiResponse.success("Compte créé avec succès. Un code de vérification a été envoyé par email.");
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        AuthUser authUser = authUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Email ou mot de passe incorrect."));

        if (!passwordEncoder.matches(request.getPassword(), authUser.getPassword())) {
            throw new InvalidCredentialsException("Email ou mot de passe incorrect.");
        }

        if (authUser.getAccountStatus() == AccountStatus.EN_ATTENTE_VERIFICATION) {
            throw new AccountNotVerifiedException("Compte non vérifié. Veuillez vérifier votre email.");
        }

        if (authUser.getAccountStatus() == AccountStatus.BLOQUE) {
            throw new AccountBlockedException("Ce compte a été bloqué.");
        }

        return buildAuthResponseAndPersistSession(authUser);
    }

    @Override
    @Transactional
    public ApiResponse<Void> verifyOtp(OtpVerificationRequest request) {
        AuthUser authUser = authUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("Aucun compte trouvé avec cet email."));

        otpService.verifyOtp(authUser, request.getCode());

        authUser.setAccountStatus(AccountStatus.ACTIF);
        authUserRepository.save(authUser);

        try {
            userServiceFeignClient.updateAccountStatus(authUser.getId(), AccountStatus.ACTIF);
        } catch (Exception e) {
            throw new ProfileCreationException("Impossible de synchroniser le compte, veuillez réessayer.");
        }

        return ApiResponse.success("Compte vérifié avec succès. Vous pouvez maintenant vous connecter.");
    }

    @Override
    @Transactional
    public ApiResponse<Void> resendOtp(ResendOtpRequest request) {
        AuthUser authUser = authUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("Aucun compte trouvé avec cet email."));

        if (authUser.getAccountStatus() != AccountStatus.EN_ATTENTE_VERIFICATION) {
            throw new InvalidOtpException("Ce compte est déjà vérifié.");
        }

        otpService.resendOtp(authUser);

        return ApiResponse.success("Un nouveau code a été envoyé.");
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String email = jwtService.extractEmail(request.getRefreshToken());

        AuthUser authUser = authUserRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Aucun compte trouvé avec cet email."));

        boolean tokenMatches = request.getRefreshToken().equals(authUser.getRefreshToken());
        boolean tokenExpired = authUser.getRefreshTokenExpiry() == null
                || authUser.getRefreshTokenExpiry().isBefore(LocalDateTime.now());

        if (!tokenMatches || tokenExpired) {
            throw new InvalidCredentialsException("Session invalide, veuillez vous reconnecter.");
        }

        return buildAuthResponseAndPersistSession(authUser);
    }

    @Override
    @Transactional
    public ApiResponse<Void> logout(RefreshTokenRequest request) {
        String email = jwtService.extractEmail(request.getRefreshToken());

        AuthUser authUser = authUserRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Aucun compte trouvé avec cet email."));

        authUser.setRefreshToken(null);
        authUser.setRefreshTokenExpiry(null);
        authUserRepository.save(authUser);

        return ApiResponse.success("Déconnexion réussie.");
    }

    @Override
    @Transactional
    public ApiResponse<Void> changeEmail(ChangeEmailRequest request) {
        AuthUser authUser = authUserRepository.findByEmail(request.getCurrentEmail())
                .orElseThrow(() -> new UserNotFoundException("Aucun compte trouvé avec cet email."));

        if (!passwordEncoder.matches(request.getPassword(), authUser.getPassword())) {
            throw new InvalidCredentialsException("Mot de passe incorrect.");
        }

        if (authUserRepository.existsByEmail(request.getNewEmail())) {
            throw new UserAlreadyExistsException("Cet email est déjà utilisé par un autre compte.");
        }

        authUser.setEmail(request.getNewEmail());
        // Un changement d'email remet le compte en attente de vérification —
        // preuve que le titulaire possède réellement cette nouvelle adresse,
        // même principe de sécurité qu'à l'inscription initiale.
        authUser.setAccountStatus(AccountStatus.EN_ATTENTE_VERIFICATION);
        authUserRepository.save(authUser);

        try {
            userServiceFeignClient.updateEmail(authUser.getId(), request.getNewEmail());
        } catch (Exception e) {
            throw new ProfileCreationException("Impossible de synchroniser le nouvel email, veuillez réessayer.");
        }

        try {
            otpService.generateAndSendOtp(authUser);
        } catch (Exception e) {
            throw new ProfileCreationException("Email modifié mais échec de l'envoi du code de vérification.");
        }

        return ApiResponse.success("Email modifié. Un code de vérification a été envoyé à la nouvelle adresse.");
    }

    @Override
    @Transactional
    public ApiResponse<Void> changePassword(ChangePasswordRequest request) {
        AuthUser authUser = authUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("Aucun compte trouvé avec cet email."));

        if (!passwordEncoder.matches(request.getOldPassword(), authUser.getPassword())) {
            throw new InvalidCredentialsException("Ancien mot de passe incorrect.");
        }

        authUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        authUserRepository.save(authUser);

        return ApiResponse.success("Mot de passe modifié avec succès.");
    }

    @Override
    @Transactional
    public void deleteAuthUser(UUID userId) {
        AuthUser authUser = authUserRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Aucun compte trouvé avec cet identifiant."));
        // Nécessaire avant de supprimer AuthUser : la contrainte de clé
        // étrangère otps.auth_user_id -> auth_users.id empêche sinon la
        // suppression tant que des OTP existent encore pour ce compte.
        otpRepository.deleteByAuthUser(authUser);
        authUserRepository.delete(authUser);
    }

    @Override
    @Transactional
    public void syncAccountStatus(UUID userId, AccountStatus status) {
        AuthUser authUser = authUserRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Aucun compte trouvé avec cet identifiant."));
        authUser.setAccountStatus(status);
        authUserRepository.save(authUser);
    }

    /**
     * Compensation manuelle : supprime le profil déjà commité côté
     * user-service, quand une étape après l'appel Feign échoue localement.
     * Best-effort — si cet appel échoue aussi, on logue clairement plutôt
     * que de masquer un profil orphelin restant en base.
     */
    private void compensateProfileCreation(UUID userId) {
        try {
            userServiceFeignClient.deleteProfile(userId);
        } catch (Exception cleanupException) {
            log.error("Échec de la compensation : profil orphelin possible dans user-service pour userId={}",
                    userId, cleanupException);
        }
    }

    private AuthResponse buildAuthResponseAndPersistSession(AuthUser authUser) {
        String accessToken = jwtService.generateAccessToken(authUser);
        String refreshToken = jwtService.generateRefreshToken(authUser);

        authUser.setRefreshToken(refreshToken);
        authUser.setRefreshTokenExpiry(
                LocalDateTime.now().plusSeconds(jwtService.getRefreshTokenExpirationMillis() / 1000)
        );
        authUserRepository.save(authUser);

        long expiresInSeconds = jwtService.getAccessTokenExpirationMillis() / 1000;
        return authUserMapper.toAuthResponse(authUser, accessToken, refreshToken, expiresInSeconds);
    }
}