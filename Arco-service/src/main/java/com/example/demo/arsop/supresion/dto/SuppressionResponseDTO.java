package com.example.demo.arsop.supresion.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SuppressionResponseDTO {
    private Boolean approved;

    private String observations;

    private String rejectionReason;

    private Boolean dataStillNecessary;

    private Boolean anotherLegalBasisExists;

    private Boolean retentionPeriodStillValid;

    private Boolean exceptionApplies;

    private LocalDateTime retentionExpiresAt;

    private Boolean anonymizeInsteadOfDelete;
}