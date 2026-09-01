package com.dialtec.authentication_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Inscription pour un client (marketplace). Volontairement minimal :
 * pas d'infos de livraison tant qu'il n'y a pas de commande/paiement
 * (Stripe, prévu pour plus tard).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterClientRequest {

    @NotBlank
    @Email(message = "Format d'email invalide.")
    private String email;

    @NotBlank
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    @NotBlank
    @Size(max = 100)
    private String fullName;

    @NotBlank
    @Pattern(regexp = "^(\\+212|0)[5-7][0-9]{8}$", message = "Numéro de téléphone marocain invalide")
    private String phoneNumber;
}