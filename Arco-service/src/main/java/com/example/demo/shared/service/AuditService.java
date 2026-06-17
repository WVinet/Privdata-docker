package com.example.demo.shared.service;

import com.example.demo.shared.enums.ActorType;
import com.example.demo.shared.enums.ArcoType;
import com.example.demo.shared.model.AuditLog;
import com.example.demo.shared.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

// El audit log es INMUTABLE — este servicio solo realiza INSERT, nunca UPDATE ni DELETE
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    // Firma completa para registros detallados (cambios de estado, resoluciones)
    public void log(UUID requestId, ArcoType arcoType, UUID actorId, ActorType actorType,
                    String action, String previousStatus, String newStatus, String reason, String ipAddress) {
        auditLogRepository.save(new AuditLog(
                null, requestId, arcoType, actorId, actorType,
                action, previousStatus, newStatus, reason, ipAddress, null
        ));
    }

    // Firma simplificada para acciones de sistema sin cambio de estado
    public void log(UUID requestId, ArcoType arcoType, ActorType actorType, String action) {
        log(requestId, arcoType, null, actorType, action, null, null, null, null);
    }

    // Firma para cambios de estado con actor identificado
    public void log(UUID requestId, ArcoType arcoType, UUID actorId, ActorType actorType,
                    String action, String previousStatus, String newStatus) {
        log(requestId, arcoType, actorId, actorType, action, previousStatus, newStatus, null, null);
    }

    // Consulta del audit log de una solicitud — usada por GET /audit endpoint
    public List<AuditLog> findByRequestId(UUID requestId) {
        return auditLogRepository.findByRequestIdOrderByCreatedAtAsc(requestId);
    }
}
