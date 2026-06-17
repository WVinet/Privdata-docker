package cl.duoc.agenciaService.model;

import cl.duoc.agenciaService.enums.AgencyClaimStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agency_claim")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AgencyClaim {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "arco_request_id", nullable = false)
    private UUID arcoRequestId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "data_subject_id", nullable = false)
    private UUID dataSubjectId;

    @Column(name = "data_subject_name", nullable = false)
    private String dataSubjectName;

    @Column(name = "data_subject_email", nullable = false)
    private String dataSubjectEmail;

    @Column(name = "data_subject_rut")
    private String dataSubjectRut;

    @Column(name = "request_type", nullable = false)
    private String requestType;

    @Column(name = "original_resolution_summary", columnDefinition = "TEXT")
    private String originalResolutionSummary;

    @Column(name = "original_denial_legal_basis", columnDefinition = "TEXT")
    private String originalDenialLegalBasis;

    @Column(name = "claim_reason", nullable = false, columnDefinition = "TEXT")
    private String claimReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AgencyClaimStatus status = AgencyClaimStatus.PENDIENTE;

    @Column(name = "agency_response", columnDefinition = "TEXT")
    private String agencyResponse;

    @Column(name = "responded_by_user_id")
    private UUID respondedByUserId;

    @Column(name = "responded_by_email")
    private String respondedByEmail;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
