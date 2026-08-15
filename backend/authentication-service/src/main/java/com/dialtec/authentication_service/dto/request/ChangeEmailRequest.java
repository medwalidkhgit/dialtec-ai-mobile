package com.dialtec.authentication_service.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeEmailRequest {

    @NotBlank(message = "L'email actuel est obligatoire.")
    @Email(message = "Format d'email invalide.")
    private String currentEmail;

    @NotBlank(message = "Le mot de passe est obligatoire.")
    private String password;

    @NotBlank(message = "Le nouvel email est obligatoire.")
    @Email(message = "Format d'email invalide.")
    private String newEmail;
}