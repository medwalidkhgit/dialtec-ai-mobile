package com.dialtec.authentication_service.service;

import com.dialtec.authentication_service.entity.AuthUser;
import com.dialtec.authentication_service.entity.Otp;
import com.dialtec.authentication_service.exception.InvalidOtpException;
import com.dialtec.authentication_service.repository.OtpRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OtpServiceTest {

    @Mock
    private OtpRepository otpRepository;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private OtpService otpService;

    private AuthUser authUser;

    @BeforeEach
    void setUp() {
        authUser = AuthUser.builder().email("test@dialtec.ma").build();

        // @Value ne s'injecte jamais automatiquement dans un test unitaire pur
        // (pas de contexte Spring) : sans ça, maxAttempts vaudrait 0 par défaut,
        // et tous les tests échoueraient au premier essai.
        ReflectionTestUtils.setField(otpService, "expirationMinutes", 10L);
        ReflectionTestUtils.setField(otpService, "maxAttempts", 5);
        ReflectionTestUtils.setField(otpService, "resendCooldownSeconds", 60L);
    }

    @Test
    void verifyOtp_codeCorrect_marqueCommeUtilise() {
        Otp otp = Otp.builder()
                .code("123456")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .used(false)
                .build();

        when(otpRepository.findTopByAuthUserAndUsedFalseOrderByCreatedAtDesc(authUser))
                .thenReturn(Optional.of(otp));

        otpService.verifyOtp(authUser, "123456");

        assertThat(otp.isUsed()).isTrue();
        verify(otpRepository).save(otp);
    }

    @Test
    void verifyOtp_codeIncorrect_incrementeLesTentativesSansMarquerUtilise() {
        Otp otp = Otp.builder()
                .code("123456")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(0)
                .used(false)
                .build();

        when(otpRepository.findTopByAuthUserAndUsedFalseOrderByCreatedAtDesc(authUser))
                .thenReturn(Optional.of(otp));

        assertThatThrownBy(() -> otpService.verifyOtp(authUser, "000000"))
                .isInstanceOf(InvalidOtpException.class);

        assertThat(otp.getAttempts()).isEqualTo(1);
        assertThat(otp.isUsed()).isFalse();
    }

    @Test
    void verifyOtp_codeExpire_leveException() {
        Otp otp = Otp.builder()
                .code("123456")
                .expiresAt(LocalDateTime.now().minusMinutes(1)) // déjà expiré
                .attempts(0)
                .used(false)
                .build();

        when(otpRepository.findTopByAuthUserAndUsedFalseOrderByCreatedAtDesc(authUser))
                .thenReturn(Optional.of(otp));

        assertThatThrownBy(() -> otpService.verifyOtp(authUser, "123456"))
                .isInstanceOf(InvalidOtpException.class)
                .hasMessageContaining("expiré");
    }

    @Test
    void verifyOtp_tropDeTentatives_leveExceptionEtInvalideLeCode() {
        Otp otp = Otp.builder()
                .code("123456")
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .attempts(5) // déjà au maximum autorisé
                .used(false)
                .build();

        when(otpRepository.findTopByAuthUserAndUsedFalseOrderByCreatedAtDesc(authUser))
                .thenReturn(Optional.of(otp));

        assertThatThrownBy(() -> otpService.verifyOtp(authUser, "123456"))
                .isInstanceOf(InvalidOtpException.class)
                .hasMessageContaining("tentatives");

        assertThat(otp.isUsed()).isTrue(); // invalidé après trop de tentatives
    }

    @Test
    void verifyOtp_aucunCodeActif_leveInvalidOtpException() {
        when(otpRepository.findTopByAuthUserAndUsedFalseOrderByCreatedAtDesc(authUser))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> otpService.verifyOtp(authUser, "123456"))
                .isInstanceOf(InvalidOtpException.class);
    }

    // --- generateAndSendOtp ---

    @Test
    void generateAndSendOtp_succes_sauvegardeUnCodeA6ChiffresEtEnvoieLEmail() {
        ArgumentCaptor<Otp> otpCaptor = ArgumentCaptor.forClass(Otp.class);

        otpService.generateAndSendOtp(authUser);

        verify(otpRepository).save(otpCaptor.capture());
        Otp savedOtp = otpCaptor.getValue();
        assertThat(savedOtp.getCode()).hasSize(6);
        assertThat(savedOtp.getCode()).matches("\\d{6}");
        assertThat(savedOtp.getAuthUser()).isEqualTo(authUser);

        verify(emailService).sendOtpEmail(eq("test@dialtec.ma"), eq(savedOtp.getCode()), eq(10L));
    }

    // --- resendOtp ---

    @Test
    void resendOtp_aucunCodePrecedent_genereDirectementUnNouveauCode() {
        when(otpRepository.findTopByAuthUserOrderByCreatedAtDesc(authUser)).thenReturn(Optional.empty());

        otpService.resendOtp(authUser);

        verify(otpRepository).save(any(Otp.class));
        verify(emailService).sendOtpEmail(eq("test@dialtec.ma"), any(), eq(10L));
    }

    @Test
    void resendOtp_cooldownPasEncoreEcoule_leveInvalidOtpExceptionEtNEnvoiePasDeNouveauCode() {
        Otp dernierOtp = Otp.builder()
                .createdAt(LocalDateTime.now().minusSeconds(30)) // seulement 30s, cooldown = 60s
                .build();

        when(otpRepository.findTopByAuthUserOrderByCreatedAtDesc(authUser)).thenReturn(Optional.of(dernierOtp));

        assertThatThrownBy(() -> otpService.resendOtp(authUser))
                .isInstanceOf(InvalidOtpException.class)
                .hasMessageContaining("patienter");

        verify(otpRepository, never()).save(any());
    }

    @Test
    void resendOtp_cooldownEcoule_genereUnNouveauCode() {
        Otp dernierOtp = Otp.builder()
                .createdAt(LocalDateTime.now().minusSeconds(120)) // 120s > cooldown 60s
                .build();

        when(otpRepository.findTopByAuthUserOrderByCreatedAtDesc(authUser)).thenReturn(Optional.of(dernierOtp));

        otpService.resendOtp(authUser);

        verify(otpRepository).save(any(Otp.class));
        verify(emailService).sendOtpEmail(eq("test@dialtec.ma"), any(), eq(10L));
    }
}