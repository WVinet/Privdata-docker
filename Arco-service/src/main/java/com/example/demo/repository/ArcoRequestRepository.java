package com.example.demo.repository;

import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.model.ArcoRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ArcoRequestRepository extends JpaRepository<ArcoRequest, UUID> {

    List<ArcoRequest> findByOrganizationId(UUID organizationId);
    List<ArcoRequest> findByDataSubjectId(UUID dataSubjectId);
    List<ArcoRequest> findByStatus(ArcoStatus status);

    // RF-ARCO-CIE-02: solicitudes listas para cierre automático
    @Query("""
        SELECT r FROM ArcoRequest r
        WHERE r.status IN (:statuses)
        AND r.agencyClaimDeadline IS NOT NULL
        AND r.agencyClaimDeadline < :now
    """)
    List<ArcoRequest> findSolicitudesListasParaCierre(
        @Param("statuses") List<ArcoStatus> statuses,
        @Param("now") LocalDateTime now
    );

    long countByDataSubjectIdAndOrganizationIdAndRequestTypeAndSubmittedAtAfter(
            UUID dataSubjectId,
            UUID organizationId,
            ArcoRequestType requestType,
            LocalDateTime fromDate
    );

    // Transición atómica RECIBIDA -> EN_REVISION: evita doble notificación si llegan
    // dos solicitudes casi simultáneas (p. ej. doble invocación de efectos en React StrictMode).
    @Modifying
    @Query("""
        UPDATE ArcoRequest r
        SET r.status = com.example.demo.enums.arcoRequest.ArcoStatus.EN_REVISION,
            r.reviewStartedAt = :now
        WHERE r.id = :id
        AND r.status = com.example.demo.enums.arcoRequest.ArcoStatus.RECIBIDA
    """)
    int marcarEnRevisionSiRecibida(@Param("id") UUID id, @Param("now") LocalDateTime now);
}