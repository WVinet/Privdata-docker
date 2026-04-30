package com.privdata.authservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssignRoleRequestDTO {

    @NotBlank(message = "El nombre del rol es obligatorio")
    private String roleName;
}