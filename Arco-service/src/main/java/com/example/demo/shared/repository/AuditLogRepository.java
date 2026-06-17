package com.example.demo.shared.repository;

import com.example.demo.shared.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByRequestIdOrderByCreatedAtAsc(UUID requestId);
}
