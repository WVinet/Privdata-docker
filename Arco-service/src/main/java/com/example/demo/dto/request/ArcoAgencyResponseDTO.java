package com.example.demo.dto.request;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

// Body del callback que envía Agencia-service (server-to-server) al responder un reclamo
@Data
public class ArcoAgencyResponseDTO {
    private UUID agencyClaimId;
    private String response;
    private LocalDateTime respondedAt;
}
