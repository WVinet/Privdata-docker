package com.example.demo.arco.opposition.repository;

import com.example.demo.arco.opposition.enums.OppositionCausal;
import com.example.demo.arco.opposition.enums.OppositionStatus;
import com.example.demo.arco.opposition.model.OppositionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface OppositionRequestRepository extends JpaRepository<OppositionRequest, UUID> {

    @Query("SELECT o FROM OppositionRequest o WHERE " +
           "o.organizationId = :organizationId AND " +
           "(:dataSubjectId IS NULL OR o.dataSubjectId = :dataSubjectId) AND " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:causal IS NULL OR o.causal = :causal) AND " +
           "(:dateFrom IS NULL OR o.submittedAt >= :dateFrom) AND " +
           "(:dateTo IS NULL OR o.submittedAt <= :dateTo) " +
           "ORDER BY o.submittedAt DESC")
    List<OppositionRequest> findWithFilters(
            @Param("organizationId") UUID organizationId,
            @Param("dataSubjectId") UUID dataSubjectId,
            @Param("status") OppositionStatus status,
            @Param("causal") OppositionCausal causal,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo
    );

    // Para scheduler de vencimientos (4.8)
    List<OppositionRequest> findByDueDateBeforeAndStatusIn(LocalDateTime dueDate, List<OppositionStatus> statuses);
}
