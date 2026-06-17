package com.example.demo.arco.oposicion;

import com.example.demo.shared.enums.ActorType;
import com.example.demo.shared.enums.ArcoType;
import com.example.demo.shared.model.AuditLog;
import com.example.demo.shared.service.AuditService;
import com.example.demo.shared.service.DeadlineCalculatorService;
import com.example.demo.arco.oposicion.dto.request.*;
import com.example.demo.arco.oposicion.enums.*;
import com.example.demo.arco.oposicion.exception.*;
import com.example.demo.arco.oposicion.model.*;
import com.example.demo.arco.oposicion.repository.*;
import com.example.demo.client.ComplianceClient;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class OppositionService {

    private final OppositionRequestRepository oppositionRepository;
    private final TemporaryBlockRepository temporaryBlockRepository;
    private final AgencyClaimRepository agencyClaimRepository;
    private final ThirdPartyNotificationRepository thirdPartyNotificationRepository;
    private final DeadlineCalculatorService deadlineCalculator;
    private final AuditService auditService;
    private final ComplianceClient complianceClient;

    // -------------------------------------------------------------------------
    // PARTE 4.1 — Crear solicitud con validación de admisibilidad
    // -------------------------------------------------------------------------

    public OppositionRequest crearSolicitud(CreateOppositionRequestDTO dto, UUID organizationId, UUID actorId) {

        // 4.1 A) Art. 8° a): interés legítimo requiere fundamentación obligatoria
        if (dto.getCausal() == OppositionCausal.INTERES_LEGITIMO
                && (dto.getJustification() == null || dto.getJustification().isBlank())) {
            throw new OppositionInadmissibleException(
                    "La causal de interés legítimo requiere fundamentación (Art. 11 Ley 21.719)");
        }

        // 4.1 B) Art. 8°: excepción para investigación científica/estadística/histórica
        boolean inadmissible = false;
        if (dto.getTreatmentActivityId() != null) {
            inadmissible = complianceClient.isExemptFromOpposition(dto.getTreatmentActivityId());
        }

        // 4.1 C) Art. 8° b): marketing directo — derecho absoluto, irrechazable
        boolean mandatoryAcceptance = dto.getCausal() == OppositionCausal.MARKETING_DIRECTO;

        LocalDateTime now = LocalDateTime.now();

        OppositionRequest solicitud = new OppositionRequest();
        solicitud.setOrganizationId(organizationId);
        solicitud.setDataSubjectId(dto.getDataSubjectId());
        solicitud.setTreatmentActivityId(dto.getTreatmentActivityId());
        solicitud.setRequesterName(dto.getRequesterName());
        solicitud.setRequesterRut(dto.getRequesterRut());
        solicitud.setRequesterEmail(dto.getRequesterEmail());
        solicitud.setContactAddress(dto.getContactAddress());
        solicitud.setRepresentativeName(dto.getRepresentativeName());
        solicitud.setRepresentativeRut(dto.getRepresentativeRut());
        solicitud.setCausal(dto.getCausal());
        solicitud.setJustification(dto.getJustification());
        solicitud.setOpposedTreatment(dto.getOpposedTreatment());
        solicitud.setRequiresMandatoryAcceptance(mandatoryAcceptance);
        solicitud.setPublicEntity(dto.isPublicEntity());
        solicitud.setSubmittedAt(now);
        solicitud.setAcknowledgedAt(now);
        // Art. 11 Ley 21.719: plazo de respuesta = 30 días CORRIDOS
        solicitud.setDueDate(deadlineCalculator.addCalendarDays(now, 30));
        solicitud.setStatus(inadmissible ? OppositionStatus.INADMISSIBLE : OppositionStatus.RECEIVED);

        OppositionRequest saved = oppositionRepository.save(solicitud);

        ActorType actorType = dto.getRepresentativeName() != null ? ActorType.REPRESENTATIVE : ActorType.TITULAR;
        auditService.log(saved.getId(), ArcoType.OPPOSITION, actorId, actorType,
                "Solicitud de oposición registrada", null, saved.getStatus().name());

        // 4.9 Art. 23: organismo público — registrar nota, no bloquear el flujo
        if (dto.isPublicEntity()) {
            auditService.log(saved.getId(), ArcoType.OPPOSITION, ActorType.SYSTEM,
                    "NOTA: El responsable es un organismo público. El flujo específico del Art. 23 " +
                    "Ley 21.719 (jefe superior del servicio, causales de rechazo por funciones " +
                    "fiscalizadoras) está preparado para implementación futura.");
        }

        // 4.1 B) Registrar inadmisibilidad en audit log
        if (inadmissible) {
            auditService.log(saved.getId(), ArcoType.OPPOSITION, ActorType.SYSTEM,
                    "Solicitud marcada INADMISSIBLE: tratamiento con fines de investigación " +
                    "científica, histórica o estadística vinculados a función pública (Art. 8° Ley 21.719)");
        }

        return saved;
    }

    // -------------------------------------------------------------------------
    // Consultas
    // -------------------------------------------------------------------------

    @jakarta.transaction.Transactional(jakarta.transaction.Transactional.TxType.SUPPORTS)
    public List<OppositionRequest> listar(UUID organizationId, UUID dataSubjectId, OppositionStatus status,
                                          OppositionCausal causal, LocalDate dateFrom, LocalDate dateTo) {
        LocalDateTime from = dateFrom != null ? dateFrom.atStartOfDay() : null;
        LocalDateTime to   = dateTo   != null ? dateTo.atTime(23, 59, 59) : null;
        return oppositionRepository.findWithFilters(organizationId, dataSubjectId, status, causal, from, to);
    }

    @jakarta.transaction.Transactional(jakarta.transaction.Transactional.TxType.SUPPORTS)
    public OppositionRequest buscarPorId(UUID id) {
        return oppositionRepository.findById(id)
                .orElseThrow(() -> new OppositionNotFoundException(id));
    }

    // -------------------------------------------------------------------------
    // Verificación de identidad
    // -------------------------------------------------------------------------

    public OppositionRequest verificarIdentidad(UUID id, UUID actorId) {
        OppositionRequest solicitud = buscarPorId(id);
        String previous = solicitud.getStatus().name();
        solicitud.setStatus(OppositionStatus.IDENTITY_VERIFIED);
        OppositionRequest saved = oppositionRepository.save(solicitud);
        auditService.log(id, ArcoType.OPPOSITION, actorId, ActorType.ANALYST,
                "Identidad verificada", previous, OppositionStatus.IDENTITY_VERIFIED.name());
        return saved;
    }

    // -------------------------------------------------------------------------
    // PARTE 4.3 — Bloqueo temporal
    // -------------------------------------------------------------------------

    public TemporaryBlock crearBloqueoTemporal(UUID id, TemporaryBlockRequestDTO dto, UUID actorId) {
        OppositionRequest solicitud = buscarPorId(id);

        LocalDateTime now = LocalDateTime.now();
        TemporaryBlock bloqueo = new TemporaryBlock();
        bloqueo.setOppositionRequest(solicitud);
        bloqueo.setJustification(dto.getJustification());
        bloqueo.setStatus(BlockStatus.PENDING);
        bloqueo.setRequestedAt(now);
        // Art. 11: plazo de 2 días HÁBILES para que el responsable responda
        bloqueo.setDueDate(deadlineCalculator.addBusinessDays(now, 2));

        TemporaryBlock saved = temporaryBlockRepository.save(bloqueo);

        String previous = solicitud.getStatus().name();
        solicitud.setStatus(OppositionStatus.TEMPORARY_BLOCK_REQUESTED);
        oppositionRepository.save(solicitud);

        auditService.log(id, ArcoType.OPPOSITION, actorId, ActorType.TITULAR,
                "Bloqueo temporal solicitado", previous, OppositionStatus.TEMPORARY_BLOCK_REQUESTED.name());

        return saved;
    }

    public TemporaryBlock resolverBloqueo(UUID id, UUID blockId, ResolveBlockDTO dto, UUID actorId) {
        TemporaryBlock bloqueo = temporaryBlockRepository.findById(blockId)
                .orElseThrow(() -> new RuntimeException("Bloqueo temporal no encontrado: " + blockId));

        OppositionRequest solicitud = buscarPorId(id);
        LocalDateTime now = LocalDateTime.now();
        String previousRequestStatus = solicitud.getStatus().name();

        if (dto.isApproved()) {
            bloqueo.setStatus(BlockStatus.APPROVED);
            solicitud.setStatus(OppositionStatus.TEMPORARY_BLOCK_APPROVED);
            auditService.log(id, ArcoType.OPPOSITION, actorId, ActorType.ANALYST,
                    "Bloqueo temporal aprobado — tratamiento congelado", previousRequestStatus,
                    OppositionStatus.TEMPORARY_BLOCK_APPROVED.name());
        } else {
            // Art. 11: rechazo del bloqueo debe notificarse a la Agencia electrónicamente
            bloqueo.setStatus(BlockStatus.REJECTED);
            bloqueo.setRejectedNotifiedAgency(true);
            bloqueo.setRejectedNotifiedAt(now);
            solicitud.setStatus(OppositionStatus.TEMPORARY_BLOCK_REJECTED);
            // 4.6: rechazo del bloqueo habilita reclamo ante Agencia
            solicitud.setStatus(OppositionStatus.AGENCY_CLAIM_AVAILABLE);
            auditService.log(id, ArcoType.OPPOSITION, actorId, ActorType.ANALYST,
                    "Bloqueo temporal rechazado — notificación a Agencia registrada (Art. 11)",
                    previousRequestStatus, OppositionStatus.AGENCY_CLAIM_AVAILABLE.name(),
                    dto.getGrounds(), null);
        }

        bloqueo.setResolutionGrounds(dto.getGrounds());
        bloqueo.setResolvedAt(now);
        bloqueo.setResolvedByUserId(actorId);

        oppositionRepository.save(solicitud);
        return temporaryBlockRepository.save(bloqueo);
    }

    // -------------------------------------------------------------------------
    // PARTE 4.4 — Prórroga (una sola vez, 30 días corridos desde HOY)
    // -------------------------------------------------------------------------

    public OppositionRequest prorrogar(UUID id, UUID actorId) {
        OppositionRequest solicitud = buscarPorId(id);

        // Art. 11: solo una prórroga permitida
        if (solicitud.isExtended()) {
            throw new ExtensionAlreadyAppliedException();
        }

        if (solicitud.getDueDate().isBefore(LocalDateTime.now())) {
            throw new DeadlineExpiredException("No se puede prorrogar una solicitud con plazo vencido");
        }

        LocalDateTime now = LocalDateTime.now();
        String previous = solicitud.getStatus().name();
        solicitud.setExtended(true);
        solicitud.setExtendedAt(now);
        // Art. 11: +30 días CORRIDOS desde la fecha actual, no desde la fecha original
        solicitud.setExtensionDate(deadlineCalculator.addCalendarDays(now, 30));
        solicitud.setStatus(OppositionStatus.EXTENDED);

        OppositionRequest saved = oppositionRepository.save(solicitud);
        auditService.log(id, ArcoType.OPPOSITION, actorId, ActorType.ANALYST,
                "Plazo prorrogado +30 días corridos (Art. 11 Ley 21.719)", previous, OppositionStatus.EXTENDED.name());
        return saved;
    }

    // -------------------------------------------------------------------------
    // PARTE 4.5 + 4.7 — Resolución final
    // -------------------------------------------------------------------------

    public OppositionRequest resolver(UUID id, ResolveOppositionDTO dto, UUID actorId) {
        OppositionRequest solicitud = buscarPorId(id);
        OppositionStatus decision = dto.getDecision();

        // 4.7 Art. 11: rechazo requiere fundamento legal obligatorio
        if ((decision == OppositionStatus.REJECTED || decision == OppositionStatus.PARTIALLY_ACCEPTED)
                && (dto.getGrounds() == null || dto.getGrounds().isBlank())) {
            throw new GroundsRequiredException();
        }

        // 4.1 C) Art. 8° b): marketing directo es irrechazable
        if (solicitud.isRequiresMandatoryAcceptance() && decision == OppositionStatus.REJECTED) {
            throw new MarketingDirectOppositionException();
        }

        LocalDateTime now = LocalDateTime.now();
        String previous = solicitud.getStatus().name();

        solicitud.setResolutionGrounds(dto.getGrounds());
        solicitud.setResolvedAt(now);
        solicitud.setResolvedByUserId(actorId);

        if (decision == OppositionStatus.ACCEPTED || decision == OppositionStatus.PARTIALLY_ACCEPTED) {
            solicitud.setStatus(decision);
            OppositionRequest saved = oppositionRepository.save(solicitud);
            auditService.log(id, ArcoType.OPPOSITION, actorId, ActorType.DPO,
                    "Resolución: " + decision.name(), previous, decision.name(), dto.getGrounds(), null);
            // 4.5: disparar subflujo de notificación a terceros cesionarios
            procesarNotificacionTerceros(saved, actorId);
            return saved;
        }

        // 4.6: rechazo total/parcial → habilitar reclamo ante Agencia
        solicitud.setStatus(OppositionStatus.AGENCY_CLAIM_AVAILABLE);
        OppositionRequest saved = oppositionRepository.save(solicitud);
        auditService.log(id, ArcoType.OPPOSITION, actorId, ActorType.DPO,
                "Resolución: " + decision.name() + " — habilitado reclamo ante Agencia",
                previous, OppositionStatus.AGENCY_CLAIM_AVAILABLE.name(), dto.getGrounds(), null);
        return saved;
    }

    // 4.5 — Subflujo notificación a cesionarios
    private void procesarNotificacionTerceros(OppositionRequest solicitud, UUID actorId) {
        List<String> cesionarios = complianceClient.getCesionarios(
                solicitud.getDataSubjectId(), solicitud.getTreatmentActivityId());

        if (cesionarios.isEmpty()) {
            // Sin cesionarios → cerrar directamente
            solicitud.setStatus(OppositionStatus.CLOSED);
            oppositionRepository.save(solicitud);
            auditService.log(solicitud.getId(), ArcoType.OPPOSITION, ActorType.SYSTEM,
                    "Sin cesionarios registrados — solicitud cerrada directamente");
        } else {
            for (String cesionario : cesionarios) {
                ThirdPartyNotification notif = new ThirdPartyNotification();
                notif.setOppositionRequest(solicitud);
                notif.setThirdPartyName(cesionario);
                notif.setNotificationReason(
                        "Oposición aceptada — cese del tratamiento de datos del titular");
                notif.setStatus(ThirdPartyNotificationStatus.PENDING);
                thirdPartyNotificationRepository.save(notif);
                auditService.log(solicitud.getId(), ArcoType.OPPOSITION, ActorType.SYSTEM,
                        "Notificación generada para cesionario: " + cesionario);
            }
            solicitud.setStatus(OppositionStatus.THIRD_PARTY_NOTIFICATION_PENDING);
            oppositionRepository.save(solicitud);
        }
    }

    // Actualizar estado de notificación a cesionario
    public ThirdPartyNotification actualizarNotificacionTercero(UUID requestId, UUID notificationId,
                                                                 UpdateThirdPartyNotificationDTO dto, UUID actorId) {
        ThirdPartyNotification notif = thirdPartyNotificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada: " + notificationId));

        ThirdPartyNotificationStatus newStatus = dto.getStatus();
        notif.setStatus(newStatus);

        if (newStatus == ThirdPartyNotificationStatus.SENT) {
            notif.setSentAt(LocalDateTime.now());
        } else if (newStatus == ThirdPartyNotificationStatus.CONFIRMED) {
            notif.setConfirmedAt(LocalDateTime.now());
        }

        ThirdPartyNotification saved = thirdPartyNotificationRepository.save(notif);

        // Verificar si todas las notificaciones están resueltas
        OppositionRequest solicitud = buscarPorId(requestId);
        boolean allDone = solicitud.getThirdPartyNotifications().stream()
                .allMatch(n -> n.getStatus() == ThirdPartyNotificationStatus.SENT
                            || n.getStatus() == ThirdPartyNotificationStatus.CONFIRMED);

        if (allDone) {
            solicitud.setStatus(OppositionStatus.THIRD_PARTY_NOTIFICATION_DONE);
            oppositionRepository.save(solicitud);
            auditService.log(requestId, ArcoType.OPPOSITION, ActorType.SYSTEM,
                    "Todos los cesionarios notificados — cambiando a CLOSED");
            solicitud.setStatus(OppositionStatus.CLOSED);
            oppositionRepository.save(solicitud);
        }

        return saved;
    }

    // -------------------------------------------------------------------------
    // PARTE 4.6 — Registrar reclamo ante la Agencia
    // -------------------------------------------------------------------------

    public AgencyClaim registrarReclamo(UUID id, CreateAgencyClaimDTO dto, UUID actorId) {
        OppositionRequest solicitud = buscarPorId(id);

        if (solicitud.getStatus() != OppositionStatus.AGENCY_CLAIM_AVAILABLE) {
            throw new AgencyClaimNotAvailableException();
        }

        LocalDateTime now = LocalDateTime.now();
        AgencyClaim reclamo = new AgencyClaim();
        reclamo.setOppositionRequest(solicitud);
        reclamo.setClaimCausal(dto.getClaimCausal());
        reclamo.setImpugnedDecision(dto.getImpugnedDecision());
        reclamo.setSupportingDocuments(dto.getSupportingDocuments());
        reclamo.setNotificationChannel(dto.getNotificationChannel());
        reclamo.setSubmittedAt(now);
        // Plazo de 30 días HÁBILES desde la presentación del reclamo
        reclamo.setAgencyClaimDeadline(deadlineCalculator.addBusinessDays(now, 30));
        reclamo.setStatus(AgencyClaimStatus.REGISTERED);

        AgencyClaim saved = agencyClaimRepository.save(reclamo);

        solicitud.setStatus(OppositionStatus.AGENCY_CLAIM_REGISTERED);
        oppositionRepository.save(solicitud);

        auditService.log(id, ArcoType.OPPOSITION, actorId, ActorType.TITULAR,
                "Reclamo ante la Agencia registrado — causal: " + dto.getClaimCausal().name(),
                OppositionStatus.AGENCY_CLAIM_AVAILABLE.name(), OppositionStatus.AGENCY_CLAIM_REGISTERED.name());

        return saved;
    }

    // Registrar suspensión ordenada por la Agencia
    public OppositionRequest registrarSuspensionAgencia(UUID id, UUID actorId) {
        OppositionRequest solicitud = buscarPorId(id);
        String previous = solicitud.getStatus().name();

        agencyClaimRepository.findByOppositionRequestId(id).stream()
                .filter(c -> c.getStatus() == AgencyClaimStatus.IN_REVIEW
                          || c.getStatus() == AgencyClaimStatus.REGISTERED)
                .forEach(c -> {
                    c.setSuspensionOrdered(true);
                    c.setSuspensionOrderedAt(LocalDateTime.now());
                    agencyClaimRepository.save(c);
                });

        solicitud.setStatus(OppositionStatus.AGENCY_SUSPENSION_ORDERED);
        OppositionRequest saved = oppositionRepository.save(solicitud);

        auditService.log(id, ArcoType.OPPOSITION, actorId, ActorType.DPO,
                "Suspensión del tratamiento ordenada por la Agencia", previous,
                OppositionStatus.AGENCY_SUSPENSION_ORDERED.name());
        return saved;
    }

    // -------------------------------------------------------------------------
    // Audit log y historial
    // -------------------------------------------------------------------------

    @jakarta.transaction.Transactional(jakarta.transaction.Transactional.TxType.SUPPORTS)
    public List<AuditLog> listarAuditLog(UUID id) {
        return auditService.findByRequestId(id);
    }

    // -------------------------------------------------------------------------
    // PARTE 4.8 — Scheduler: detección automática de vencimientos (cada hora)
    // -------------------------------------------------------------------------

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void detectarVencimientos() {
        LocalDateTime now = LocalDateTime.now();

        // Solicitudes con due_date vencido y status no terminal
        List<OppositionStatus> statusesActivos = List.of(
                OppositionStatus.RECEIVED,
                OppositionStatus.IDENTITY_PENDING,
                OppositionStatus.IDENTITY_VERIFIED,
                OppositionStatus.ADMISSIBILITY_CHECK,
                OppositionStatus.UNDER_REVIEW,
                OppositionStatus.EXTENDED
        );

        List<OppositionRequest> vencidas = oppositionRepository
                .findByDueDateBeforeAndStatusIn(now, statusesActivos);

        for (OppositionRequest s : vencidas) {
            s.setStatus(OppositionStatus.NO_RESPONSE_EXPIRED);
            oppositionRepository.save(s);
            s.setStatus(OppositionStatus.AGENCY_CLAIM_AVAILABLE);
            oppositionRepository.save(s);
            auditService.log(s.getId(), ArcoType.OPPOSITION, ActorType.SYSTEM,
                    "Plazo vencido sin respuesta → habilitado reclamo ante Agencia (Art. 11 Ley 21.719)");
            log.info("Solicitud {} vencida — estado actualizado a AGENCY_CLAIM_AVAILABLE", s.getId());
        }

        // Bloqueos temporales con due_date vencido sin respuesta → EXPIRED (equivale a APPROVED)
        List<TemporaryBlock> bloqueosVencidos = temporaryBlockRepository
                .findByDueDateBeforeAndStatus(now, BlockStatus.PENDING);

        for (TemporaryBlock b : bloqueosVencidos) {
            b.setStatus(BlockStatus.EXPIRED);
            temporaryBlockRepository.save(b);

            OppositionRequest solicitud = b.getOppositionRequest();
            solicitud.setStatus(OppositionStatus.TEMPORARY_BLOCK_APPROVED);
            oppositionRepository.save(solicitud);

            auditService.log(solicitud.getId(), ArcoType.OPPOSITION, ActorType.SYSTEM,
                    "Bloqueo temporal vencido sin respuesta — equivale a APPROVED por omisión (Art. 11)");
            log.info("Bloqueo {} vencido — actualizado a EXPIRED", b.getId());
        }
    }
}
