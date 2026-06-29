package com.example.demo.arsop.solicitudesAdicionales.anonimizacion.service;


import com.example.demo.arsop.common.dto.VerifyIdentityDTO;
import com.example.demo.arsop.common.service.EmailService;
import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.dto.CreateAnonymizationDTO;
import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.enums.AnonymizationDecision;
import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.enums.AnonymizationStatus;
import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.model.AnonymizationRequest;
import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.repository.AnonymizationRequestRepository;
import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.dto.AnonymizationResponseDTO;
import com.example.demo.client.OrganizationClient;
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
public class AnonymizationService {

    private final ArcoRequestRepository arcoRequestRepository;
    private final AnonymizationRequestRepository anonymizationRequestRepository;
    private final OrganizationClient organizationClient;
    private final EmailService emailService;

    @Transactional
    public ArcoRequest create(CreateAnonymizationDTO dto) {

        ArcoRequest request = new ArcoRequest();

        request.setOrganizationId(
                dto.getArcoRequest().getOrganizationId()
        );

        request.setDataSubjectId(
                dto.getArcoRequest().getDataSubjectId()
        );

        request.setAssignedToUserId(
                dto.getArcoRequest().getAssignedToUserId()
        );

        request.setRequestType(
                ArcoRequestType.ANONIMIZACION
        );

        request.setRequestChannel(
                dto.getArcoRequest().getRequestChannel()
        );

        request.setDescription(
                dto.getArcoRequest().getDescription()
        );

        request.setStatus(
                ArcoStatus.RECIBIDA
        );

        request.setIdentityVerificationStatus(
                ArcoIdentityVerificationStatus.PENDIENTE
        );

        LocalDateTime now = LocalDateTime.now();

        request.setSubmittedAt(now);

        request.setDueDate(
                BusinessDaysCalculator.calcularFechaLimite(
                        now,
                        ArcoRequestType.ANONIMIZACION
                )
        );

        ArcoRequest saved =
                arcoRequestRepository.save(request);

        AnonymizationRequest detail =
                AnonymizationRequest.builder()
                        .arcoRequest(saved)
                        .cause(dto.getCause())
                        .reason(dto.getReason())
                        .anonymizationStatus(
                                AnonymizationStatus.IDENTIDAD_PENDIENTE
                        )
                        .build();

        anonymizationRequestRepository.save(detail);

        notificarCreacion(saved);

        return saved;
    }

    @Transactional
    public ArcoRequest verifyIdentity(
            UUID requestId,
            VerifyIdentityDTO dto
    ) {

        AnonymizationRequest detail =
                anonymizationRequestRepository
                        .findByArcoRequest_Id(requestId)
                        .orElseThrow(
                                () -> new ArcoRequestNotFoundException(requestId)
                        );

        ArcoRequest request =
                detail.getArcoRequest();

        if (dto.getVerified()) {

            request.setIdentityVerificationStatus(
                    ArcoIdentityVerificationStatus.VERIFICADA
            );

            request.setStatus(
                    ArcoStatus.EN_GESTION
            );
            request.setManagementStartedAt(LocalDateTime.now());

            detail.setAnonymizationStatus(
                    AnonymizationStatus.EN_GESTION
            );

        } else {

            request.setIdentityVerificationStatus(
                    ArcoIdentityVerificationStatus.RECHAZADA
            );

            request.setStatus(
                    ArcoStatus.RECHAZADA
            );

            detail.setAnonymizationStatus(
                    AnonymizationStatus.IDENTIDAD_RECHAZADA
            );

            request.setResolvedAt(
                    LocalDateTime.now()
            );

            request.setResolutionSummary(
                    dto.getComment()
            );
        }

        anonymizationRequestRepository.save(detail);

        ArcoRequest saved =
                arcoRequestRepository.save(request);

        notificarCambioEstado(
                saved,
                dto.getComment()
        );

        return saved;
    }

    @Transactional
    public ArcoRequest respond(
            UUID requestId,
            AnonymizationResponseDTO dto
    ) {

        AnonymizationRequest detail =
                anonymizationRequestRepository
                        .findByArcoRequest_Id(requestId)
                        .orElseThrow(
                                () -> new ArcoRequestNotFoundException(requestId)
                        );

        ArcoRequest request =
                detail.getArcoRequest();

        if (!dto.getApproved()) {

            detail.setDecision(
                    AnonymizationDecision.REJECTED
            );

            detail.setAnonymizationStatus(
                    AnonymizationStatus.RECHAZADA
            );

            detail.setRejectionReason(
                    dto.getRejectionReason()
            );

            detail.setResponseSummary(
                    dto.getRejectionReason()
            );

            request.setStatus(
                    ArcoStatus.RECHAZADA
            );

            request.setResolvedAt(
                    LocalDateTime.now()
            );

            request.setResolutionSummary(
                    dto.getRejectionReason()
            );

            anonymizationRequestRepository.save(detail);

            ArcoRequest saved =
                    arcoRequestRepository.save(request);

            notificarResolucion(saved);

            return saved;
        }

        if (Boolean.TRUE.equals(dto.getExceptionApplies())) {

            detail.setDecision(
                    AnonymizationDecision.REJECTED
            );

            detail.setAnonymizationStatus(
                    AnonymizationStatus.RECHAZADA
            );

            detail.setResponseSummary(
                    "Solicitud rechazada: no es posible anonimizar los datos."
            );

            request.setStatus(
                    ArcoStatus.RECHAZADA
            );

            request.setResolvedAt(
                    LocalDateTime.now()
            );

            request.setResolutionSummary(
                    "Solicitud rechazada: no es posible anonimizar los datos."
            );

            anonymizationRequestRepository.save(detail);

            return arcoRequestRepository.save(request);
        }

        organizationClient.anonymizePerson(
                request.getOrganizationId(),
                request.getDataSubjectId()
        );

        detail.setDecision(
                AnonymizationDecision.APPROVED
        );

        detail.setAnonymizationStatus(
                AnonymizationStatus.RESPONDIDA
        );

        detail.setResponseSummary(
                dto.getObservations()
        );

        request.setStatus(
                ArcoStatus.RESPONDIDA
        );

        request.setResolvedAt(
                LocalDateTime.now()
        );

        request.setResolutionSummary(
                dto.getObservations()
        );

        anonymizationRequestRepository.save(detail);

        ArcoRequest saved =
                arcoRequestRepository.save(request);

        notificarResolucion(saved);

        return saved;
    }

    private void notificarCreacion(
            ArcoRequest request
    ) {

        try {

            PersonResponseDTO personResponse =
                    organizationClient.findPersonById(
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

            System.out.println(ex.getMessage());
        }
    }

    private void notificarCambioEstado(
            ArcoRequest request,
            String comment
    ) {

        try {

            PersonResponseDTO personResponse =
                    organizationClient.findPersonById(
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

            System.out.println(ex.getMessage());
        }
    }

    private void notificarResolucion(
            ArcoRequest request
    ) {

        try {

            PersonResponseDTO personResponse =
                    organizationClient.findPersonById(
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

            System.out.println(ex.getMessage());
        }
    }
}