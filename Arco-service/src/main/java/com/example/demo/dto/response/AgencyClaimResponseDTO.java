package com.example.demo.dto.response;

import com.example.demo.arco.oposicion.enums.AgencyClaimStatus;
import com.example.demo.arco.oposicion.model.AgencyClaim;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AgencyClaimResponseDTO {
    private UUID id;
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
    private AgencyClaimStatus status;
    private String agencyResponse;
    private String respondedByEmail;
    private LocalDateTime respondedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


}
