package cl.duoc.agenciaService.dto.response;

import cl.duoc.agenciaService.enums.AgencyClaimStatus;
import cl.duoc.agenciaService.model.AgencyClaim;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AgencyClaimResponseDTO {
    private UUID id;
    private UUID arcoRequestId;
    private UUID organizationId;
    private String organizationName;
    private String organizationEmail;
    private UUID dataSubjectId;
    private String dataSubjectName;
    private String dataSubjectEmail;
    private String dataSubjectRut;
    private String requestType;
    private String originalResolutionSummary;
    private String originalDenialLegalBasis;
    private String originalResolvedByEmail;
    private String claimReason;
    private AgencyClaimStatus status;
    private String agencyResponse;
    private String respondedByEmail;
    private LocalDateTime respondedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AgencyClaimResponseDTO fromEntity(AgencyClaim e) {
        AgencyClaimResponseDTO dto = new AgencyClaimResponseDTO();
        dto.setId(e.getId());
        dto.setArcoRequestId(e.getArcoRequestId());
        dto.setOrganizationId(e.getOrganizationId());
        dto.setOrganizationName(e.getOrganizationName());
        dto.setOrganizationEmail(e.getOrganizationEmail());
        dto.setDataSubjectId(e.getDataSubjectId());
        dto.setDataSubjectName(e.getDataSubjectName());
        dto.setDataSubjectEmail(e.getDataSubjectEmail());
        dto.setDataSubjectRut(e.getDataSubjectRut());
        dto.setRequestType(e.getRequestType());
        dto.setOriginalResolutionSummary(e.getOriginalResolutionSummary());
        dto.setOriginalDenialLegalBasis(e.getOriginalDenialLegalBasis());
        dto.setOriginalResolvedByEmail(e.getOriginalResolvedByEmail());
        dto.setClaimReason(e.getClaimReason());
        dto.setStatus(e.getStatus());
        dto.setAgencyResponse(e.getAgencyResponse());
        dto.setRespondedByEmail(e.getRespondedByEmail());
        dto.setRespondedAt(e.getRespondedAt());
        dto.setSubmittedAt(e.getSubmittedAt());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
