package com.example.demo.dto.response;

import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoRequestChannel;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.model.ArcoRequest;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArcoRequestResponseDTO {

    private UUID id;
    private UUID organizationId;
    private UUID dataSubjectId;
    private UUID assignedToUserId;
    private ArcoRequestType requestType;
    private ArcoRequestChannel requestChannel;
    private ArcoStatus status;
    private ArcoIdentityVerificationStatus identityVerificationStatus;
    private String description;
    private String resolutionSummary;
    private LocalDateTime reviewStartedAt;
    private LocalDateTime managementStartedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime dueDate;
    private LocalDateTime resolvedAt;
    private String resolvedByEmail;
    private String denialLegalBasis;
    private boolean extensionGranted;
    private LocalDateTime extendedDueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Campos nuevos RF-ARCO-CIE y RF-ARCO-10
    private LocalDateTime agencyClaimDeadline;
    private boolean titularDisconforme;
    private LocalDateTime closedAt;
    private boolean thirdPartiesNotified;

    // Reclamo ante la Agencia (Agencia-service)
    private UUID agencyClaimId;
    private String agencyResolution;
    private LocalDateTime agencyRespondedAt;

    // Documentos adjuntos
    private String supportingDocumentKey;
    private String responseDocumentKey;

    // Medida provisional de bloqueo
    private LocalDateTime blockAppliedAt;
    private LocalDateTime blockLiftedAt;
    private String blockAppliedByEmail;
    private String blockScope;

    public static ArcoRequestResponseDTO fromEntity(ArcoRequest e) {
        ArcoRequestResponseDTO dto = new ArcoRequestResponseDTO();
        dto.setId(e.getId());
        dto.setOrganizationId(e.getOrganizationId());
        dto.setDataSubjectId(e.getDataSubjectId());
        dto.setAssignedToUserId(e.getAssignedToUserId());
        dto.setRequestType(e.getRequestType());
        dto.setRequestChannel(e.getRequestChannel());
        dto.setStatus(e.getStatus());
        dto.setIdentityVerificationStatus(e.getIdentityVerificationStatus());
        dto.setDescription(e.getDescription());
        dto.setResolutionSummary(e.getResolutionSummary());
        dto.setReviewStartedAt(e.getReviewStartedAt());
        dto.setManagementStartedAt(e.getManagementStartedAt());
        dto.setSubmittedAt(e.getSubmittedAt());
        dto.setDueDate(e.getDueDate());
        dto.setResolvedAt(e.getResolvedAt());
        dto.setResolvedByEmail(e.getResolvedByEmail());
        dto.setDenialLegalBasis(e.getDenialLegalBasis());
        dto.setExtensionGranted(e.isExtensionGranted());
        dto.setExtendedDueDate(e.getExtendedDueDate());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        // Nuevos
        dto.setAgencyClaimDeadline(e.getAgencyClaimDeadline());
        dto.setTitularDisconforme(e.isTitularDisconforme());
        dto.setClosedAt(e.getClosedAt());
        dto.setThirdPartiesNotified(e.isThirdPartiesNotified());
        dto.setAgencyClaimId(e.getAgencyClaimId());
        dto.setAgencyResolution(e.getAgencyResolution());
        dto.setAgencyRespondedAt(e.getAgencyRespondedAt());
        dto.setSupportingDocumentKey(e.getSupportingDocumentKey());
        dto.setResponseDocumentKey(e.getResponseDocumentKey());
        dto.setBlockAppliedAt(e.getBlockAppliedAt());
        dto.setBlockLiftedAt(e.getBlockLiftedAt());
        dto.setBlockAppliedByEmail(e.getBlockAppliedByEmail());
        dto.setBlockScope(e.getBlockScope());
        return dto;
    }
}