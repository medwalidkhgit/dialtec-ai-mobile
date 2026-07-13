package com.dialtec.authentication_service.service;

import com.dialtec.authentication_service.entity.AuthUser;
import com.dialtec.authentication_service.entity.Otp;
import com.dialtec.authentication_service.exception.InvalidOtpException;
import com.dialtec.authentication_service.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class OtpService {

    private static final int OTP_LENGTH = 6; // doit rester aligné avec Otp.code (@Column(length = 6))
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OtpRepository otpRepository;
    private final EmailService emailService;

    @Value("${otp.expiration-minutes}")
    private long expirationMinutes;

    @Value("${otp.max-attempts}")
    private int maxAttempts;

    @Value("${otp.resend-cooldown-seconds}")
    private long resendCooldownSeconds;

    @Transactional
    public void generateAndSendOtp(AuthUser authUser) {
        Otp otp = Otp.builder()
                .authUser(authUser)
                .code(generateCode())
                .expiresAt(LocalDateTime.now().plusMinutes(expirationMinutes))
                .build();
        otpRepository.save(otp);
        emailService.sendOtpEmail(authUser.getEmail(), otp.getCode(), expirationMinutes);
    }

    @Transactional
    public void resendOtp(AuthUser authUser) {
        otpRepository.findTopByAuthUserOrderByCreatedAtDesc(authUser).ifPresent(lastOtp -> {
            long secondsSinceLastOtp = ChronoUnit.SECONDS.between(lastOtp.getCreatedAt(), LocalDateTime.now());
            if (secondsSinceLastOtp < resendCooldownSeconds) {
                throw new InvalidOtpException("Veuillez patienter avant de demander un nouveau code.");
            }
        });
        generateAndSendOtp(authUser);
    }

    @Transactional
    public void verifyOtp(AuthUser authUser, String code) {
        Otp otp = otpRepository.findTopByAuthUserAndUsedFalseOrderByCreatedAtDesc(authUser)
                .orElseThrow(() -> new InvalidOtpException("Aucun code actif, veuillez en demander un nouveau."));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidOtpException("Ce code a expiré, veuillez en demander un nouveau.");
        }

        if (otp.getAttempts() >= maxAttempts) {
            otp.setUsed(true);
            otpRepository.save(otp);
            throw new InvalidOtpException("Trop de tentatives, veuillez demander un nouveau code.");
        }

        if (!otp.getCode().equals(code)) {
            otp.setAttempts(otp.getAttempts() + 1);
            otpRepository.save(otp);
            throw new InvalidOtpException("Code incorrect.");
        }

        otp.setUsed(true);
        otpRepository.save(otp);
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }
}