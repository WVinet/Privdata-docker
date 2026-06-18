package com.example.demo.arsop.supresion.dto;

import com.example.demo.arsop.supresion.enums.SuppressionCause;
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