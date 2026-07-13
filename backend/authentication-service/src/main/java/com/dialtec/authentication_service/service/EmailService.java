package com.dialtec.authentication_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otpCode, long expiryMinutes) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Dialtec - Code de vérification");
        message.setText(String.format(
                "Votre code de vérification est : %s%n%nCe code expire dans %d minutes.",
                otpCode, expiryMinutes
        ));
        mailSender.send(message);
    }
}