package com.example.demo.arsop.solicitudesAdicionales.bloqueo.service;


import com.example.demo.arsop.common.dto.VerifyIdentityDTO;
import com.example.demo.arsop.common.service.EmailService;
import com.example.demo.arsop.solicitudesAdicionales.bloqueo.dto.BlockingResponseDTO;
import com.example.demo.arsop.solicitudesAdicionales.bloqueo.dto.CreateBlockingDTO;
import com.example.demo.arsop.solicitudesAdicionales.bloqueo.enums.BlockingDecision;
import com.example.demo.arsop.solicitudesAdicionales.bloqueo.enums.BlockingStatus;
import com.example.demo.arsop.solicitudesAdicionales.bloqueo.model.BlockingRequest;
import com.example.demo.arsop.solicitudesAdicionales.bloqueo.repository.BlockingRequestRepository;
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
public class BlockingService {

    private final ArcoRequestRepository arcoRequestRepository;
    private final BlockingRequestRepository blockingRequestRepository;
    private final OrganizationClient organizationClient;
    private final EmailService emailService;

    @Transactional
    public ArcoRequest create(CreateBlockingDTO dto) {

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
                ArcoRequestType.BLOQUEO_TEMPORAL
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
                        ArcoRequestType.BLOQUEO_TEMPORAL
                )
        );

        ArcoRequest saved =
                arcoRequestRepository.save(request);

        BlockingRequest detail =
                BlockingRequest.builder()
                        .arcoRequest(saved)
                        .cause(dto.getCause())
                        .reason(dto.getReason())
                        .blockingStatus(
                                BlockingStatus.IDENTIDAD_PENDIENTE
                        )
                        .build();

        blockingRequestRepository.save(detail);

        notificarCreacion(saved);

        return saved;
    }

    @Transactional
    public ArcoRequest verifyIdentity(
            UUID requestId,
            VerifyIdentityDTO dto
    ) {

        BlockingRequest detail =
                blockingRequestRepository
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

            detail.setBlockingStatus(
                    BlockingStatus.EN_GESTION
            );

        } else {

            request.setIdentityVerificationStatus(
                    ArcoIdentityVerificationStatus.RECHAZADA
            );

            request.setStatus(
                    ArcoStatus.RECHAZADA
            );

            detail.setBlockingStatus(
                    BlockingStatus.IDENTIDAD_RECHAZADA
            );

            request.setResolvedAt(
                    LocalDateTime.now()
            );

            request.setResolutionSummary(
                    dto.getComment()
            );
        }

        blockingRequestRepository.save(detail);

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
            BlockingResponseDTO dto
    ) {

        BlockingRequest detail =
                blockingRequestRepository
                        .findByArcoRequest_Id(requestId)
                        .orElseThrow(
                                () -> new ArcoRequestNotFoundException(requestId)
                        );

        ArcoRequest request =
                detail.getArcoRequest();

        if (!dto.getApproved()) {

            detail.setDecision(
                    BlockingDecision.REJECTED
            );

            detail.setBlockingStatus(
                    BlockingStatus.RECHAZADA
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

            blockingRequestRepository.save(detail);

            ArcoRequest saved =
                    arcoRequestRepository.save(request);

            notificarResolucion(saved);

            return saved;
        }

        if (Boolean.TRUE.equals(dto.getExceptionApplies())) {

            detail.setDecision(
                    BlockingDecision.REJECTED
            );

            detail.setBlockingStatus(
                    BlockingStatus.RECHAZADA
            );

            detail.setResponseSummary(
                    "Solicitud rechazada: existe una excepción legal aplicable."
            );

            request.setStatus(
                    ArcoStatus.RECHAZADA
            );

            request.setResolvedAt(
                    LocalDateTime.now()
            );

            request.setResolutionSummary(
                    "Solicitud rechazada: existe una excepción legal aplicable."
            );

            blockingRequestRepository.save(detail);

            return arcoRequestRepository.save(request);
        }

        organizationClient.blockPerson(
                request.getOrganizationId(),
                request.getDataSubjectId()
        );

        detail.setDecision(
                BlockingDecision.APPROVED
        );

        detail.setBlockingStatus(
                BlockingStatus.RESPONDIDA
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

        blockingRequestRepository.save(detail);

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