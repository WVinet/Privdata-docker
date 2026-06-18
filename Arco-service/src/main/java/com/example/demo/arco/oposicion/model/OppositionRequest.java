package com.example.demo.arco.oposicion.model;

import com.example.demo.arco.oposicion.enums.OppositionCause;
import com.example.demo.arco.oposicion.enums.OppositionDecision;
import com.example.demo.arco.oposicion.enums.OppositionStatus;
import com.example.demo.model.ArcoRequest;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OppositionRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne
    @JoinColumn(name = "arco_request_id", nullable = false, unique = true)
    private ArcoRequest arcoRequest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OppositionStatus oppositionStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OppositionCause cause;

    @Enumerated(EnumType.STRING)
    private OppositionDecision decision;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String processingPurpose;

    @Column(columnDefinition = "TEXT")
    private String opposedTreatment;

    private Boolean overridingLegitimateGrounds;

    private Boolean legalObligationApplies;

    private Boolean publicInterestApplies;

    private Boolean exceptionApplies;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(columnDefinition = "TEXT")
    private String responseSummary;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}