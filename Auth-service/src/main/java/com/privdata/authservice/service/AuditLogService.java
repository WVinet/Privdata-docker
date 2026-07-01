package com.privdata.authservice.service;

import com.privdata.authservice.dto.request.AuditLogRequest;
import com.privdata.authservice.dto.response.AuditLogResponse;
import com.privdata.authservice.model.AuditLog;
import com.privdata.authservice.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository repository;

    public void log(AuditLogRequest req) {
        AuditLog entry = new AuditLog();
        entry.setOrganizationId(req.getOrganizationId() != null ? UUID.fromString(req.getOrganizationId()) : null);
        entry.setAction(req.getAction());
        entry.setEntityType(req.getEntityType());
        entry.setDetail(req.getDetail());
        entry.setPerformedByEmail(req.getPerformedByEmail());
        repository.save(entry);
    }

    public Page<AuditLogResponse> list(String organizationId, int page, int size, String search) {
        UUID orgId = UUID.fromString(organizationId);
        PageRequest pr = PageRequest.of(page, size);
        Page<AuditLog> results = (search != null && !search.isBlank())
                ? repository.searchByOrganizationId(orgId, search.trim(), pr)
                : repository.findByOrganizationIdOrderByCreatedAtDesc(orgId, pr);
        return results.map(e -> new AuditLogResponse(
                e.getId(),
                e.getOrganizationId() != null ? e.getOrganizationId().toString() : null,
                e.getAction(),
                e.getEntityType(),
                e.getDetail(),
                e.getPerformedByEmail(),
                e.getCreatedAt()
        ));
    }
}
