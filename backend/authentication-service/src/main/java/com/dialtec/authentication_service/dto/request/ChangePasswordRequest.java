package com.dialtec.authentication_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    @NotBlank(message = "L'email est obligatoire.")
    @Email(message = "Format d'email invalide.")
    private String email;

    @NotBlank(message = "L'ancien mot de passe est obligatoire.")
    private String oldPassword;

    @NotBlank(message = "Le nouveau mot de passe est obligatoire.")
    @Size(min = 8, message = "Le nouveau mot de passe doit contenir au moins 8 caractères.")
    private String newPassword;
}