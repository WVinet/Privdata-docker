package com.example.demo.arco.oposicion.service;

import com.example.demo.arco.common.dto.VerifyIdentityDTO;
import com.example.demo.arco.common.service.EmailService;
import com.example.demo.arco.oposicion.dto.OppositionResponseDTO;
import com.example.demo.arco.oposicion.enums.OppositionCause;
import com.example.demo.arco.oposicion.enums.OppositionDecision;
import com.example.demo.arco.oposicion.enums.OppositionStatus;
import com.example.demo.arco.oposicion.model.OppositionRequest;
import com.example.demo.arco.oposicion.repository.OppositionRequestRepository;
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
public class OppositionService {

    private final ArcoRequestRepository arcoRequestRepository;
    private final OppositionRequestRepository oppositionRequestRepository;
    private final OrganizationClient organizationClient;
    private final EmailService emailService;

    @Transactional
    public ArcoRequest crear(
            ArcoRequestCreateDTO dto,
            OppositionCause cause,
            String reason,
            String processingPurpose,
            String opposedTreatment
    ) {

        ArcoRequest request = new ArcoRequest();

        request.setOrganizationId(dto.getOrganizationId());
        request.setDataSubjectId(dto.getDataSubjectId());
        request.setAssignedToUserId(dto.getAssignedToUserId());

        request.setRequestType(ArcoRequestType.OPOSICION);

        request.setRequestChannel(dto.getRequestChannel());
        request.setDescription(dto.getDescription());

        request.setStatus(ArcoStatus.RECIBIDA);

        request.setIdentityVerificationStatus(
                ArcoIdentityVerificationStatus.PENDIENTE
        );

        LocalDateTime now = LocalDateTime.now();

        request.setSubmittedAt(now);

        request.setDueDate(
                BusinessDaysCalculator.calcularFechaLimite(
                        now,
                        ArcoRequestType.OPOSICION
                )
        );

        ArcoRequest saved = arcoRequestRepository.save(request);

        OppositionRequest detail = OppositionRequest.builder()
                .arcoRequest(saved)
                .oppositionStatus(OppositionStatus.IDENTIDAD_PENDIENTE)
                .cause(cause)
                .reason(reason)
                .processingPurpose(processingPurpose)
                .opposedTreatment(opposedTreatment)
                .build();

        oppositionRequestRepository.save(detail);

        notificarCreacion(saved);

        return saved;
    }

    @Transactional
    public ArcoRequest verifyIdentity(
            UUID requestId,
            VerifyIdentityDTO dto
    ) {

        OppositionRequest detail =
                oppositionRequestRepository
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

            detail.setOppositionStatus(
                    OppositionStatus.EN_GESTION
            );

        } else {

            request.setIdentityVerificationStatus(
                    ArcoIdentityVerificationStatus.RECHAZADA
            );

            request.setStatus(ArcoStatus.RECHAZADA);

            detail.setOppositionStatus(
                    OppositionStatus.IDENTIDAD_RECHAZADA
            );

            request.setResolvedAt(LocalDateTime.now());

            request.setResolutionSummary(dto.getComment());
        }

        oppositionRequestRepository.save(detail);

        ArcoRequest saved =
                arcoRequestRepository.save(request);

        notificarCambioEstado(saved, dto.getComment());

        return saved;
    }

    @Transactional
    public ArcoRequest respondRequest(
            UUID requestId,
            OppositionResponseDTO dto
    ) {

        OppositionRequest detail =
                oppositionRequestRepository
                        .findByArcoRequest_Id(requestId)
                        .orElseThrow(
                                () -> new ArcoRequestNotFoundException(requestId)
                        );

        ArcoRequest request = detail.getArcoRequest();

        if (request.getStatus() != ArcoStatus.EN_GESTION) {
            throw new IllegalStateException(
                    "La solicitud no se encuentra en gestión."
            );
        }

        detail.setOverridingLegitimateGrounds(
                dto.getOverridingLegitimateGrounds()
        );

        detail.setLegalObligationApplies(
                dto.getLegalObligationApplies()
        );

        detail.setPublicInterestApplies(
                dto.getPublicInterestApplies()
        );

        detail.setExceptionApplies(
                dto.getExceptionApplies()
        );

        if (!dto.getApproved()) {

            detail.setDecision(
                    OppositionDecision.REJECTED
            );

            detail.setOppositionStatus(
                    OppositionStatus.RECHAZADA
            );

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
                    BusinessDaysCalculator.calcularFechaLimite(
                            LocalDateTime.now(),
                            request.getRequestType()
                    )
            );

            oppositionRequestRepository.save(detail);

            ArcoRequest saved =
                    arcoRequestRepository.save(request);

            notificarResolucion(saved);

            return saved;
        }

        if (Boolean.TRUE.equals(dto.getExceptionApplies())) {

            String reason =
                    "Solicitud rechazada: existen fundamentos legales que permiten continuar el tratamiento.";

            detail.setDecision(
                    OppositionDecision.REJECTED
            );

            detail.setOppositionStatus(
                    OppositionStatus.RECHAZADA
            );

            detail.setRejectionReason(reason);

            detail.setResponseSummary(reason);

            request.setStatus(
                    ArcoStatus.RECHAZADA
            );

            request.setResolvedAt(
                    LocalDateTime.now()
            );

            request.setResolutionSummary(reason);

            request.setAgencyClaimDeadline(
                    BusinessDaysCalculator.calcularFechaLimite(
                            LocalDateTime.now(),
                            request.getRequestType()
                    )
            );

            oppositionRequestRepository.save(detail);

            ArcoRequest saved =
                    arcoRequestRepository.save(request);

            notificarResolucion(saved);

            return saved;
        }

        organizationClient.restrictProcessing(
                request.getOrganizationId(),
                request.getDataSubjectId(),
                detail.getProcessingPurpose()
        );

        String summary =
                dto.getObservations() != null &&
                        !dto.getObservations().isBlank()
                        ? dto.getObservations()
                        : "Solicitud aprobada. Se restringió el tratamiento de los datos.";

        detail.setDecision(
                OppositionDecision.APPROVED
        );

        detail.setOppositionStatus(
                OppositionStatus.RESPONDIDA
        );

        detail.setResponseSummary(summary);

        request.setStatus(
                ArcoStatus.RESPONDIDA
        );

        request.setResolvedAt(
                LocalDateTime.now()
        );

        request.setResolutionSummary(summary);

        request.setAgencyClaimDeadline(
                BusinessDaysCalculator.calcularFechaLimite(
                        LocalDateTime.now(),
                        request.getRequestType()
                )
        );

        oppositionRequestRepository.save(detail);

        ArcoRequest saved =
                arcoRequestRepository.save(request);

        notificarResolucion(saved);

        return saved;
    }

    private String resolveDefaultRejectionReason(
            OppositionRequest detail
    ) {

        if (Boolean.TRUE.equals(detail.getExceptionApplies())) {
            return "Solicitud rechazada: existen fundamentos legales que permiten continuar el tratamiento.";
        }

        return switch (detail.getCause()) {

            case LEGITIMATE_INTEREST ->
                    "Solicitud rechazada: existen motivos legítimos imperiosos para continuar el tratamiento.";

            case DIRECT_MARKETING ->
                    "Solicitud rechazada: no se acreditó suficientemente la oposición al tratamiento de marketing.";

            case PUBLIC_SOURCE ->
                    "Solicitud rechazada: existe una base legal válida para continuar el tratamiento.";
        };
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
}