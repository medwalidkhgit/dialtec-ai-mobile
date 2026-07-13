package com.dialtec.authentication_service.service;

import com.dialtec.authentication_service.FeignClient.UserServiceFeignClient;
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
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthUserRepository authUserRepository;
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

        // Pas de compensation manuelle nécessaire : @Transactional annule
        // automatiquement le save() ci-dessus si l'appel Feign échoue,
        // puisque rien n'est encore commité en base à ce stade.
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

        otpService.generateAndSendOtp(authUser);

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

        otpService.generateAndSendOtp(authUser);

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

        // Le try/catch traduit l'exception en message propre pour le client,
        // mais @Transactional annule quand même tout (statut local + OTP
        // marqué "used") puisque ProfileCreationException est une
        // RuntimeException non interceptée avant la fin de la méthode.
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