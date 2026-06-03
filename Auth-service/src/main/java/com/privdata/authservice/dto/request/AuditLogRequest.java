package com.privdata.authservice.dto.request;

import lombok.Data;

@Data
public class AuditLogRequest {
    private String organizationId;
    private String action;
    private String entityType;
    private String detail;
    private String performedByEmail;
}
