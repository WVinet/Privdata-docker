package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class ArcoResponseDTO {
    private UUID id;
    private UUID organizationId;
    private UUID dataSubjectId;
    private UUID assignedToUserId;
    private String requestType;
    private String status;
    private String identityVerificationStatus;
    private String requestChannel;
    private LocalDateTime submittedAt;
    private LocalDateTime dueDate;
    private String description;
    private String resolutionSummary;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
