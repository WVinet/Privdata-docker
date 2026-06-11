package com.example.demo.arco.common.repository;

import com.example.demo.arco.common.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByRequestIdOrderByCreatedAtAsc(UUID requestId);
}
