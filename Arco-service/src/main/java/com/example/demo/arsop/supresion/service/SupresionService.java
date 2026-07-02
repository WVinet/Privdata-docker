package com.example.demo.arsop.supresion.service;

import com.example.demo.arsop.common.dto.VerifyIdentityDTO;
import com.example.demo.arsop.common.service.EmailService;
import com.example.demo.arsop.supresion.dto.SuppressionResponseDTO;
import com.example.demo.client.AuthClient;
import com.example.demo.arsop.supresion.enums.SuppressionCause;
import com.example.demo.arsop.supresion.enums.SuppressionDecision;
import com.example.demo.arsop.supresion.enums.SuppressionStatus;
import com.example.demo.arsop.supresion.model.SuppressionRequest;
import com.example.demo.arsop.supresion.repository.SuppressionRequestRepository;
import com.example.demo.client.OrganizationClient;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.dto.response.PersonResponseDTO;
import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.exception.ArcoRequestNotFoundException;
import com.example.demo.model.ArcoRequest;
import com.example.demo.repository.ArcoRequestRepository;
import com.example.demo.util.BusinessDaysCalculator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupresionService {

    private final ArcoRequestRepository arcoRequestRepository;
    private final SuppressionRequestRepository suppressionRequestRepository;
    private final OrganizationClient organizationClient;
    private final AuthClient authClient;
    private final EmailService emailService;

    @Transactional
    public ArcoRequest crear(
            ArcoRequestCreateDTO dto,
            SuppressionCause cause,
            String reason,
            String originalPurpose,
            LocalDateTime consentRevokedAt,
            LocalDateTime dataCollectedAt,
            LocalDateTime retentionExpiresAt
    ) {

        ArcoRequest request = new ArcoRequest();

        request.setOrganizationId(dto.getOrganizationId());
        request.setDataSubjectId(dto.getDataSubjectId());
        request.setAssignedToUserId(dto.getAssignedToUserId());
        request.setRequestType(ArcoRequestType.SUPRESION);
        request.setRequestChannel(dto.getRequestChannel());
        request.setDescription(dto.getDescription());
        request.setStatus(ArcoStatus.RECIBIDA);
        request.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.PENDIENTE);

        LocalDateTime now = LocalDateTime.now();
        request.setSubmittedAt(now);
        request.setDueDate(
                BusinessDaysCalculator.calcularFechaLimite(now, ArcoRequestType.SUPRESION)
        );

        ArcoRequest saved = arcoRequestRepository.save(request);

        SuppressionRequest detail = SuppressionRequest.builder()
                .arcoRequest(saved)
                .suppressionStatus(SuppressionStatus.IDENTIDAD_PENDIENTE)
                .cause(cause)
                .reason(reason)
                .originalPurpose(originalPurpose)
                .consentRevokedAt(consentRevokedAt)
                .dataCollectedAt(dataCollectedAt)
                .retentionExpiresAt(retentionExpiresAt)
                .build();

        suppressionRequestRepository.save(detail);

        notificarCreacion(saved);

        return saved;
    }

    @Transactional
    public ArcoRequest verifyIdentity(
            UUID requestId,
            VerifyIdentityDTO dto
    ) {

        SuppressionRequest detail =
                suppressionRequestRepository
                        .findByArcoRequest_Id(requestId)
                        .orElseThrow(
                                () -> new ArcoRequestNotFoundException(requestId)
                        );

        ArcoRequest request = detail.getArcoRequest();

        if (dto.getVerified()) {

            request.setIdentityVerificationStatus(
                    ArcoIdentityVerificationStatus.VERIFICADA
            );

            request.setStatus(ArcoStatus.EN_GESTION);
            request.setManagementStartedAt(LocalDateTime.now());

            detail.setSuppressionStatus(
                    SuppressionStatus.EN_GESTION
            );

        } else {

            request.setIdentityVerificationStatus(
                    ArcoIdentityVerificationStatus.RECHAZADA
            );

            request.setStatus(ArcoStatus.RECHAZADA);

            detail.setSuppressionStatus(
                    SuppressionStatus.IDENTIDAD_RECHAZADA
            );

            request.setResolvedAt(LocalDateTime.now());

            request.setResolutionSummary(dto.getComment());
            autoLiftBlock(request);
        }

        suppressionRequestRepository.save(detail);

        ArcoRequest saved =
                arcoRequestRepository.save(request);

        if (dto.getVerified()) {
            notificarEnGestion(saved);
        } else {
            notificarCambioEstado(saved, dto.getComment());
        }

        return saved;
    }

    @Transactional
    public ArcoRequest respondRequest(UUID requestId, SuppressionResponseDTO dto) {

        SuppressionRequest detail =
                suppressionRequestRepository.findByArcoRequest_Id(requestId)
                        .orElseThrow(() -> new ArcoRequestNotFoundException(requestId));

        ArcoRequest request = detail.getArcoRequest();

        if (request.getStatus() != ArcoStatus.EN_GESTION) {
            throw new IllegalStateException("La solicitud no se encuentra en gestión.");
        }

        if (dto == null || dto.getApproved() == null) {
            throw new IllegalArgumentException("Debe indicar si la solicitud fue aprobada o rechazada.");
        }

        if (dto.getResolvedByEmail() != null) {
            request.setResolvedByEmail(dto.getResolvedByEmail());
        }

        detail.setDataStillNecessary(dto.getDataStillNecessary());
        detail.setAnotherLegalBasisExists(dto.getAnotherLegalBasisExists());
        detail.setRetentionPeriodStillValid(dto.getRetentionPeriodStillValid());
        detail.setExceptionApplies(dto.getExceptionApplies());

        if (dto.getRetentionExpiresAt() != null) {
            detail.setRetentionExpiresAt(dto.getRetentionExpiresAt());
        }

        if (!dto.getApproved()) {
            detail.setDecision(SuppressionDecision.REJECTED);
            detail.setSuppressionStatus(SuppressionStatus.RECHAZADA);

            String reason = dto.getRejectionReason();

            if (reason == null || reason.isBlank()) {
                reason = resolveDefaultRejectionReason(detail);
            }

            detail.setRejectionReason(reason);
            detail.setResponseSummary(reason);

            request.setStatus(ArcoStatus.RECHAZADA);
            request.setResolvedAt(LocalDateTime.now());
            request.setResolutionSummary(reason);
            request.setAgencyClaimDeadline(
                    BusinessDaysCalculator.calcularFechaLimite(LocalDateTime.now(), request.getRequestType())
            );
            autoLiftBlock(request);
            suppressionRequestRepository.save(detail);
            ArcoRequest saved = arcoRequestRepository.save(request);
            notificarResolucion(saved);
            return saved;
        }

        if (Boolean.TRUE.equals(dto.getExceptionApplies())) {
            String reason = "Solicitud rechazada: aplica una excepción legal que impide la supresión.";

            detail.setDecision(SuppressionDecision.REJECTED);
            detail.setSuppressionStatus(SuppressionStatus.RECHAZADA);
            detail.setRejectionReason(reason);
            detail.setResponseSummary(reason);

            request.setStatus(ArcoStatus.RECHAZADA);
            request.setResolvedAt(LocalDateTime.now());
            request.setResolutionSummary(reason);
            request.setAgencyClaimDeadline(
                    BusinessDaysCalculator.calcularFechaLimite(LocalDateTime.now(), request.getRequestType())
            );
            autoLiftBlock(request);
            suppressionRequestRepository.save(detail);
            ArcoRequest saved = arcoRequestRepository.save(request);
            notificarResolucion(saved);
            return saved;
        }

        organizationClient.anonymizeDataSubject(
                request.getOrganizationId(),
                request.getDataSubjectId()
        );

        try {
            authClient.disableByPersonId(request.getDataSubjectId());
        } catch (Exception ex) {
            System.out.println("No se pudo deshabilitar la cuenta del titular: " + ex.getMessage());
        }

        String summary = dto.getObservations() != null && !dto.getObservations().isBlank()
                ? dto.getObservations()
                : "Solicitud de supresión aprobada. Tus datos han sido anonimizados y tu cuenta ha sido desactivada. No podrás volver a iniciar sesión.";

        detail.setDecision(SuppressionDecision.APPROVED);
        detail.setSuppressionStatus(SuppressionStatus.RESPONDIDA);
        detail.setResponseSummary(summary);

        request.setStatus(ArcoStatus.RESPONDIDA);
        request.setResolvedAt(LocalDateTime.now());
        request.setResolutionSummary(summary);
        request.setAgencyClaimDeadline(
                BusinessDaysCalculator.calcularFechaLimite(LocalDateTime.now(), request.getRequestType())
        );
        autoLiftBlock(request);
        suppressionRequestRepository.save(detail);
        ArcoRequest saved = arcoRequestRepository.save(request);
        notificarResolucion(saved);
        return saved;
    }

    private void autoLiftBlock(ArcoRequest request) {
        if (request.getBlockAppliedAt() != null && request.getBlockLiftedAt() == null) {
            request.setBlockLiftedAt(LocalDateTime.now());
        }
    }

    private void notificarCreacion(ArcoRequest request) {
        try {
            PersonResponseDTO personResponse = organizationClient.findPersonById(
                    request.getOrganizationId(),
                    request.getDataSubjectId()
            );
            emailService.sendRequestCreatedEmail(
                    personResponse.getData().getEmail(),
                    request.getId(),
                    request.getRequestType().name(),
                    request.getStatus().name()
            );
        } catch (Exception ex) {
            System.out.println("No se pudo enviar correo de creación: " + ex.getMessage());
        }
    }

    private void notificarEnGestion(ArcoRequest request) {
        try {
            PersonResponseDTO personResponse = organizationClient.findPersonById(
                    request.getOrganizationId(), request.getDataSubjectId());
            emailService.sendEnGestionEmail(
                    personResponse.getData().getEmail(), request.getId(), request.getRequestType().name());
        } catch (Exception ex) {
            System.out.println("No se pudo enviar correo de gestión: " + ex.getMessage());
        }
    }

    private void notificarCambioEstado(ArcoRequest request, String comment) {
        try {
            PersonResponseDTO personResponse = organizationClient.findPersonById(
                    request.getOrganizationId(),
                    request.getDataSubjectId()
            );
            emailService.sendStatusChangedEmail(
                    personResponse.getData().getEmail(),
                    request.getId(),
                    request.getStatus().name(),
                    comment
            );
        } catch (Exception ex) {
            System.out.println("No se pudo enviar correo de cambio de estado: " + ex.getMessage());
        }
    }

    private void notificarResolucion(ArcoRequest request) {
        try {
            PersonResponseDTO personResponse = organizationClient.findPersonById(
                    request.getOrganizationId(),
                    request.getDataSubjectId()
            );
            emailService.sendResolutionEmail(
                    personResponse.getData().getEmail(),
                    request.getId(),
                    request.getStatus().name(),
                    request.getResolutionSummary()
            );
        } catch (Exception ex) {
            System.out.println("No se pudo enviar correo de resolución: " + ex.getMessage());
        }
    }

    private String resolveDefaultRejectionReason(SuppressionRequest detail) {

        if (Boolean.TRUE.equals(detail.getExceptionApplies())) {
            return "Solicitud rechazada: aplica una excepción legal que impide la supresión.";
        }

        return switch (detail.getCause()) {
            case DATA_NOT_NECESSARY -> Boolean.TRUE.equals(detail.getDataStillNecessary())
                    ? "Solicitud rechazada: los datos aún son necesarios para la finalidad declarada."
                    : "Solicitud rechazada: no se acreditó suficientemente la causal de datos no necesarios.";

            case CONSENT_REVOKED -> Boolean.TRUE.equals(detail.getAnotherLegalBasisExists())
                    ? "Solicitud rechazada: existe otro fundamento legal que autoriza el tratamiento."
                    : "Solicitud rechazada: no se acreditó suficientemente la revocación del consentimiento.";

            case DATA_EXPIRED -> Boolean.TRUE.equals(detail.getRetentionPeriodStillValid())
                    ? "Solicitud rechazada: los datos aún se encuentran dentro del plazo de conservación."
                    : "Solicitud rechazada: no se acreditó suficientemente la caducidad de los datos.";
        };
    }
}
