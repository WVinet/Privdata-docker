package cl.duoc.agenciaService.dto.request;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AgencyClaimCreateRequest {
    private UUID arcoRequestId;
    private UUID organizationId;
    private UUID dataSubjectId;
    private String dataSubjectName;
    private String dataSubjectEmail;
    private String dataSubjectRut;
    private String requestType;
    private String originalResolutionSummary;
    private String originalDenialLegalBasis;
    private String claimReason;
    private LocalDateTime submittedAt;
}
