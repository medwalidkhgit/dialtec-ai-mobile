package com.dialtec.authentication_service.dto.request;

import com.dialtec.authentication_service.enums.ShopCategory;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterCommercantRequest {

    // --- Credentials (authentication-service) ---

    @NotBlank
    @Email(message = "Format d'email invalide.")
    private String email;

    @NotBlank
    @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères")
    private String password;

    // --- Profil du commerçant (transmis à user-service) ---

    @NotBlank
    @Size(max = 100)
    private String fullName;

    @NotNull
    private ShopCategory shopCategory;

    @NotBlank
    @Pattern(regexp = "^(\\+212|0)[5-7][0-9]{8}$", message = "Numéro de téléphone marocain invalide")
    private String phoneNumber;

    @NotBlank
    @Size(max = 255)
    private String address;

    @NotBlank
    @Size(max = 100)
    private String city;

    @NotBlank
    @Pattern(regexp = "^[0-9]{5}$", message = "Le code postal doit contenir 5 chiffres")
    private String postalCode;

    @Size(max = 500)
    private String description;
}