package com.privdata.authservice.repository;

import com.privdata.authservice.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    Page<AuditLog> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);

    @Query("SELECT a FROM AuditLog a WHERE a.organizationId = :orgId " +
           "AND (LOWER(a.detail) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.action) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.entityType) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(a.performedByEmail) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> searchByOrganizationId(@Param("orgId") UUID orgId,
                                           @Param("search") String search,
                                           Pageable pageable);
}
