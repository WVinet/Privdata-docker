package com.example.demo.arco.oposicion.model;

import com.example.demo.arco.oposicion.enums.AgencyClaimStatus;
import com.example.demo.arco.oposicion.enums.ClaimCausal;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agency_claim")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AgencyClaim {

    @Id
    @GeneratedValue
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opposition_request_id", nullable = false)
    private OppositionRequest oppositionRequest;

    @Enumerated(EnumType.STRING)
    @Column(name = "claim_causal", nullable = false)
    private ClaimCausal claimCausal;

    @Column(name = "impugned_decision", columnDefinition = "TEXT")
    private String impugnedDecision;

    @Column(name = "supporting_documents", columnDefinition = "TEXT")
    private String supportingDocuments;

    @Column(name = "notification_channel")
    private String notificationChannel;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    // Plazo de 30 días hábiles desde la presentación del reclamo
    @Column(name = "agency_claim_deadline", nullable = false)
    private LocalDateTime agencyClaimDeadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AgencyClaimStatus status;

    @Column(name = "agency_resolution", columnDefinition = "TEXT")
    private String agencyResolution;

    @Column(name = "suspension_ordered", nullable = false)
    private boolean suspensionOrdered = false;

    @Column(name = "suspension_ordered_at")
    private LocalDateTime suspensionOrderedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
