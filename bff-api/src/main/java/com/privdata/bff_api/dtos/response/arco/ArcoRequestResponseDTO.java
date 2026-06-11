package com.privdata.bff_api.dtos.response.arco;

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
    private LocalDateTime submittedAt;
    private LocalDateTime dueAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ArcoRequestResponseDTO fromEntity(ArcoRequest e) {
        return new ArcoRequestResponseDTO(
                e.getId(),
                e.getOrganizationId(),
                e.getDataSubjectId(),
                e.getAssignedToUserId(),
                e.getRequestType(),
                e.getRequestChannel(),
                e.getStatus(),
                e.getIdentityVerificationStatus(),
                e.getDescription(),
                e.getResolutionSummary(),
                e.getSubmittedAt(),
                e.getDueDate(),
                e.getResolvedAt(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
