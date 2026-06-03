package com.privdata.authservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
public class AuditLogResponse {
    private UUID id;
    private String organizationId;
    private String action;
    private String entityType;
    private String detail;
    private String performedByEmail;
    private LocalDateTime createdAt;
}
