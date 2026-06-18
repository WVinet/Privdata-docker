package com.example.demo.arsop.supresion.model;

import com.example.demo.arsop.supresion.enums.SuppressionCause;
import com.example.demo.arsop.supresion.enums.SuppressionDecision;
import com.example.demo.arsop.supresion.enums.SuppressionStatus;
import com.example.demo.model.ArcoRequest;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuppressionRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne
    @JoinColumn(name = "arco_request_id", nullable = false, unique = true)
    private ArcoRequest arcoRequest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SuppressionStatus suppressionStatus;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SuppressionCause cause;

    @Enumerated(EnumType.STRING)
    private SuppressionDecision decision;

    @Column(columnDefinition = "TEXT")
    private String originalPurpose;

    private LocalDateTime consentRevokedAt;

    private LocalDateTime dataCollectedAt;

    private LocalDateTime retentionExpiresAt;

    private Boolean dataStillNecessary;

    private Boolean anotherLegalBasisExists;

    private Boolean retentionPeriodStillValid;

    private Boolean exceptionApplies;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(columnDefinition = "TEXT")
    private String responseSummary;
}