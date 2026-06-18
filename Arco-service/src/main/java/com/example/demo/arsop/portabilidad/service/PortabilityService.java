package com.example.demo.arsop.portabilidad.service;

import com.example.demo.arsop.common.dto.VerifyIdentityDTO;
import com.example.demo.arsop.common.service.EmailService;
import com.example.demo.arsop.portabilidad.dto.CreatePortabilityDTO;
import com.example.demo.arsop.portabilidad.dto.PortabilityResponseDTO;
import com.example.demo.arsop.portabilidad.enums.PortabilityDecision;
import com.example.demo.arsop.portabilidad.enums.PortabilityStatus;
import com.example.demo.arsop.portabilidad.model.PortabilityRequest;
import com.example.demo.arsop.portabilidad.repository.PortabilityRequestRepository;
import com.example.demo.client.OrganizationClient;
import com.example.demo.dto.response.PersonResponseDTO;
import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.exception.ArcoRequestNotFoundException;
import com.example.demo.model.ArcoRequest;
import com.example.demo.repository.ArcoRequestRepository;
import com.example.demo.util.BusinessDaysCalculator;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PortabilityService {

    private final ArcoRequestRepository arcoRequestRepository;
    private final PortabilityRequestRepository portabilityRequestRepository;
    private final OrganizationClient organizationClient;
    private final EmailService emailService;

    @Transactional
    public ArcoRequest create(CreatePortabilityDTO dto) {

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
                ArcoRequestType.PORTABILIDAD
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
                        ArcoRequestType.PORTABILIDAD
                )
        );

        ArcoRequest saved =
                arcoRequestRepository.save(request);

        PortabilityRequest detail =
                PortabilityRequest.builder()
                        .arcoRequest(saved)
                        .cause(dto.getCause())
                        .portabilityStatus(
                                PortabilityStatus.IDENTIDAD_PENDIENTE
                        )
                        .destinationOrganization(
                                dto.getDestinationOrganization()
                        )
                        .reason(dto.getReason())
                        .build();

        portabilityRequestRepository.save(detail);

        notificarCreacion(saved);

        return saved;
    }

    @Transactional
    public ArcoRequest verifyIdentity(
            UUID requestId,
            VerifyIdentityDTO dto
    ) {

        PortabilityRequest detail =
                portabilityRequestRepository
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

            detail.setPortabilityStatus(
                    PortabilityStatus.EN_GESTION
            );

        } else {

            request.setIdentityVerificationStatus(
                    ArcoIdentityVerificationStatus.RECHAZADA
            );

            request.setStatus(
                    ArcoStatus.RECHAZADA
            );

            detail.setPortabilityStatus(
                    PortabilityStatus.IDENTIDAD_RECHAZADA
            );

            request.setResolvedAt(
                    LocalDateTime.now()
            );

            request.setResolutionSummary(
                    dto.getComment()
            );
        }

        portabilityRequestRepository.save(detail);

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
            PortabilityResponseDTO dto
    ) {

        PortabilityRequest detail =
                portabilityRequestRepository
                        .findByArcoRequest_Id(requestId)
                        .orElseThrow(
                                () -> new ArcoRequestNotFoundException(requestId)
                        );

        ArcoRequest request =
                detail.getArcoRequest();

        if (!dto.getApproved()) {

            detail.setDecision(
                    PortabilityDecision.REJECTED
            );

            detail.setPortabilityStatus(
                    PortabilityStatus.RECHAZADA
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

            portabilityRequestRepository.save(detail);

            ArcoRequest saved =
                    arcoRequestRepository.save(request);

            notificarResolucion(saved);

            return saved;
        }

        String filePath =
                generatePortableJson(
                        request.getOrganizationId(),
                        request.getDataSubjectId()
                );

        detail.setGeneratedFilePath(
                filePath
        );

        detail.setGeneratedFileName(
                Path.of(filePath)
                        .getFileName()
                        .toString()
        );

        detail.setDecision(
                PortabilityDecision.APPROVED
        );

        detail.setPortabilityStatus(
                PortabilityStatus.RESPONDIDA
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

        portabilityRequestRepository.save(detail);

        ArcoRequest saved =
                arcoRequestRepository.save(request);

        notificarResolucion(saved);

        return saved;
    }

    private String generatePortableJson(
            UUID organizationId,
            UUID personId
    ) {

        try {

            PersonResponseDTO personResponse =
                    organizationClient.findPersonById(
                            organizationId,
                            personId
                    );

            Map<String, Object> payload =
                    new LinkedHashMap<>();

            payload.put(
                    "generatedAt",
                    LocalDateTime.now().toString()
            );

            payload.put(
                    "organizationId",
                    organizationId
            );

            payload.put(
                    "person",
                    personResponse.getData()
            );

            String json =
                    new ObjectMapper()
                            .writerWithDefaultPrettyPrinter()
                            .writeValueAsString(payload);

            Path storageDir =
                    Paths.get(
                            "portability-files"
                    );

            Files.createDirectories(storageDir);

            String fileName =
                    "portability-"
                            + personId
                            + ".json";

            Path filePath =
                    storageDir.resolve(fileName);

            Files.writeString(
                    filePath,
                    json
            );

            return filePath.toString();

        } catch (Exception ex) {

            throw new RuntimeException(
                    "No fue posible generar archivo de portabilidad",
                    ex
            );
        }
    }

    public ResponseEntity<Resource> download(
            UUID requestId
    ) {

        try {

            PortabilityRequest request =
                    portabilityRequestRepository
                            .findByArcoRequest_Id(requestId)
                            .orElseThrow(
                                    () -> new ArcoRequestNotFoundException(
                                            requestId
                                    )
                            );

            Path path =
                    Paths.get(
                            request.getGeneratedFilePath()
                    );

            Resource resource =
                    new UrlResource(
                            path.toUri()
                    );

            return ResponseEntity.ok()
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\""
                                    + request.getGeneratedFileName()
                                    + "\""
                    )
                    .body(resource);

        } catch (Exception ex) {

            throw new RuntimeException(
                    "No fue posible descargar archivo",
                    ex
            );
        }
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

            System.out.println(
                    "No se pudo enviar correo de creación: "
                            + ex.getMessage()
            );
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

            System.out.println(
                    "No se pudo enviar correo de cambio de estado: "
                            + ex.getMessage()
            );
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

            System.out.println(
                    "No se pudo enviar correo de resolución: "
                            + ex.getMessage()
            );
        }
    }
}