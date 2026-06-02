package com.privdata.authservice.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class InviteRequestDTO {

    @Email(message = "El correo no tiene un formato válido")
    @NotBlank(message = "El correo es obligatorio")
    private String email;

    @NotNull(message = "El organizationId es obligatorio")
    private UUID organizationId;

    @NotNull(message = "El personId es obligatorio")
    private UUID personId;

    @NotBlank(message = "El rol es obligatorio")
    private String roleName;
}
