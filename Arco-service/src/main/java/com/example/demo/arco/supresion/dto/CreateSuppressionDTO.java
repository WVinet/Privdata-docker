package com.example.demo.arco.supresion.dto;

import com.example.demo.arco.supresion.enums.SuppressionCause;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateSuppressionDTO {

    private ArcoRequestCreateDTO arcoRequest;

    private SuppressionCause cause;

    private String reason;

    private String originalPurpose;

    private LocalDateTime consentRevokedAt;

    private LocalDateTime dataCollectedAt;

    private LocalDateTime retentionExpiresAt;
}