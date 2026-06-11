package com.example.demo.dto.response;

import java.util.UUID;

public record OrgResponseDTO(
        UUID id,
        String name,
        String legalName,
        String rut,
        String businessType,
        String email,
        String phone,
        String address
) {
}
