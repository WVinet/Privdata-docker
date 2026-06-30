package com.example.demo.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.example.demo.enums.arcoRequest.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ArcoRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "data_subject_id", nullable = false)
    private UUID dataSubjectId;

    @Column(name = "assigned_to_user_id", nullable = true)
    private UUID assignedToUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false)
    private ArcoRequestType requestType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ArcoStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "identity_verification_status", nullable = false)
    private ArcoIdentityVerificationStatus identityVerificationStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_channel", nullable = false)
    private ArcoRequestChannel requestChannel;

    @Enumerated(EnumType.STRING)
    @Column(name = "cancellation_action_type")
    private ArcoCancellationType cancellationActionType;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    // Momento en que el admin abrió la solicitud y pasó a EN_REVISION
    @Column(name = "review_started_at", nullable = true)
    private LocalDateTime reviewStartedAt;

    // Momento en que se verificó la identidad y la solicitud pasó a EN_GESTION
    @Column(name = "management_started_at", nullable = true)
    private LocalDateTime managementStartedAt;

    @Column(name = "resolution_summary", nullable = true, columnDefinition = "TEXT")
    private String resolutionSummary;

    @Column(name = "resolved_at", nullable = true)
    private LocalDateTime resolvedAt;

    // Email de quien gestionó/resolvió la solicitud (RESPONDIDA/RECHAZADA), para trazabilidad ante la Agencia
    @Column(name = "resolved_by_email", nullable = true)
    private String resolvedByEmail;

    @Column(name = "denial_legal_basis", nullable = true, columnDefinition = "TEXT")
    private String denialLegalBasis;

    @Column(name = "extension_granted", nullable = false, columnDefinition = "boolean default false")
    private boolean extensionGranted;

    @Column(name = "extended_due_date", nullable = true)
    private LocalDateTime extendedDueDate;

    // RF-ARCO-CIE-01: plazo para reclamar ante la Agencia (Art. 11 paso 7)
    // resolvedAt + 30 días hábiles — calculado al pasar a RESPONDIDA o RECHAZADA
    @Column(name = "agency_claim_deadline", nullable = true)
    private LocalDateTime agencyClaimDeadline;

    // RF-ARCO-CIE-03: el titular registró disconformidad desde el portal
    @Column(name = "titular_disconforme", nullable = false, columnDefinition = "boolean default false")
    private boolean titularDisconforme = false;

    // RF-ARCO-CIE-02: timestamp de cierre automático por scheduler
    @Column(name = "closed_at", nullable = true)
    private LocalDateTime closedAt;

    // RF-ARCO-10: se notificó a terceros que recibieron los datos
    @Column(name = "third_parties_notified", nullable = false, columnDefinition = "boolean default false")
    private boolean thirdPartiesNotified = false;

    // Reclamo ante la Agencia (Agencia-service) — referencia al agency_claim.id creado allí
    @Column(name = "agency_claim_id", nullable = true)
    private UUID agencyClaimId;

    // Respuesta de la Agencia, sincronizada vía callback PATCH /respuesta-agencia
    @Column(name = "agency_resolution", nullable = true, columnDefinition = "TEXT")
    private String agencyResolution;

    @Column(name = "agency_responded_at", nullable = true)
    private LocalDateTime agencyRespondedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "arcoRequest", cascade = CascadeType.ALL)
    private List<ArcoRequestEvidences> evidences;

    @JsonIgnore
    @OneToMany(mappedBy = "arcoRequest", cascade = CascadeType.ALL)
    private List<ArcoRequestActions> actions;

    @JsonIgnore
    @OneToMany(mappedBy = "arcoRequest", cascade = CascadeType.ALL)
    private List<ArcoRequestStatusHistory> statusHistory;
}