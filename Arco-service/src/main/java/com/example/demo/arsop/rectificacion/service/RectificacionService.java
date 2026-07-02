package com.example.demo.arsop.rectificacion.service;

import com.example.demo.arsop.common.dto.VerifyIdentityDTO;
import com.example.demo.arsop.rectificacion.dto.RectificationResponseDTO;
import com.example.demo.arsop.rectificacion.enums.RectificationStatus;
import com.example.demo.arsop.rectificacion.model.RectificationRequest;
import com.example.demo.arsop.rectificacion.repository.RectificationRequestRepository;
import com.example.demo.client.AuthClient;
import com.example.demo.client.OrganizationClient;
import com.example.demo.arsop.common.service.EmailService;
import com.example.demo.dto.response.PersonResponseDTO;
import com.example.demo.dto.request.PersonRectificationRequestDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RectificacionService {

    private final ArcoRequestRepository arcoRequestRepository;
    private final RectificationRequestRepository rectificationRequestRepository;
    private final OrganizationClient organizationClient;
    private final AuthClient authClient;
    private final EmailService emailService;
    @Transactional
    public ArcoRequest crear(ArcoRequestCreateDTO dto) {
        PersonRectificationRequestDTO emptyRectification = new PersonRectificationRequestDTO();
        return crear(dto, emptyRectification);
    }

    @Transactional
    public ArcoRequest crear(ArcoRequestCreateDTO dto, PersonRectificationRequestDTO rectificationDTO) {

        if (rectificationDTO == null) {
            rectificationDTO = new PersonRectificationRequestDTO();
        }

        ArcoRequest solicitud = new ArcoRequest();
        solicitud.setOrganizationId(dto.getOrganizationId());
        solicitud.setDataSubjectId(dto.getDataSubjectId());
        solicitud.setAssignedToUserId(dto.getAssignedToUserId());
        solicitud.setRequestType(ArcoRequestType.RECTIFICACION);
        solicitud.setRequestChannel(dto.getRequestChannel());
        solicitud.setDescription(dto.getDescription());
        solicitud.setStatus(ArcoStatus.RECIBIDA);
        solicitud.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.PENDIENTE);

        LocalDateTime now = LocalDateTime.now();
        solicitud.setSubmittedAt(now);
        solicitud.setDueDate(BusinessDaysCalculator.calcularFechaLimite(now, ArcoRequestType.RECTIFICACION));

        ArcoRequest saved = arcoRequestRepository.save(solicitud);

        RectificationRequest detail = RectificationRequest.builder()
                .arcoRequest(saved)
                .rectificationStatus(RectificationStatus.IDENTIDAD_PENDIENTE)
                .justification(dto.getDescription())
                .firstName(rectificationDTO.getFirstName())
                .lastName(rectificationDTO.getLastName())
                .rut(rectificationDTO.getRut())
                .email(rectificationDTO.getEmail())
                .phone(rectificationDTO.getPhone())
                .position(rectificationDTO.getPosition())
                .build();

        rectificationRequestRepository.save(detail);
        notificarCreacion(saved);

        return saved;
    }

    @Transactional
    public ArcoRequest verifyIdentity(UUID requestId, VerifyIdentityDTO dto) {

        RectificationRequest detail = rectificationRequestRepository.findByArcoRequest_Id(requestId)
                .orElseThrow(() -> new ArcoRequestNotFoundException(requestId));

        ArcoRequest request = detail.getArcoRequest();

        if (request.getRequestType() != ArcoRequestType.RECTIFICACION) {
            throw new IllegalArgumentException("La solicitud no corresponde al derecho de rectificación.");
        }

        if (request.getIdentityVerificationStatus() != ArcoIdentityVerificationStatus.PENDIENTE) {
            throw new IllegalStateException("La identidad ya fue resuelta.");
        }

        if (dto.getVerified()) {
            request.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.VERIFICADA);
            request.setStatus(ArcoStatus.EN_GESTION);
            request.setManagementStartedAt(LocalDateTime.now());
            detail.setRectificationStatus(RectificationStatus.EN_GESTION);
        } else {
            request.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.RECHAZADA);
            request.setStatus(ArcoStatus.RECHAZADA);
            request.setResolvedAt(LocalDateTime.now());
            request.setResolutionSummary(dto.getComment());
            detail.setRectificationStatus(RectificationStatus.IDENTIDAD_RECHAZADA);
            autoLiftBlock(request);
        }

        rectificationRequestRepository.save(detail);
        ArcoRequest saved = arcoRequestRepository.save(request);

        if (dto.getVerified()) {
            notificarEnGestion(saved);
        } else {
            String msg = (dto.getComment() != null && !dto.getComment().isBlank())
                    ? dto.getComment() : "No fue posible verificar la identidad del titular.";
            notificarCambioEstado(saved, msg);
        }
        return saved;
    }

    @Transactional
    public ArcoRequest respondRequest(UUID requestId, RectificationResponseDTO dto) {

        RectificationRequest detail = rectificationRequestRepository.findByArcoRequest_Id(requestId)
                .orElseThrow(() -> new ArcoRequestNotFoundException(requestId));

        ArcoRequest request = detail.getArcoRequest();

        if (request.getStatus() != ArcoStatus.EN_GESTION) {
            throw new IllegalStateException("La solicitud no se encuentra en gestión.");
        }

        PersonRectificationRequestDTO rectificationDTO = new PersonRectificationRequestDTO();
        rectificationDTO.setFirstName(detail.getFirstName());
        rectificationDTO.setLastName(detail.getLastName());
        rectificationDTO.setRut(detail.getRut());
        rectificationDTO.setEmail(detail.getEmail());
        rectificationDTO.setPhone(detail.getPhone());
        rectificationDTO.setPosition(detail.getPosition());

        organizationClient.rectificationDataSubject(
                request.getOrganizationId(),
                request.getDataSubjectId(),
                rectificationDTO
        );

        if (detail.getEmail() != null && !detail.getEmail().isBlank()) {
            authClient.updateEmailByPersonId(request.getDataSubjectId(), detail.getEmail());
        }

        detail.setRectificationStatus(RectificationStatus.RESPONDIDA);
        detail.setResponseSummary(
                dto != null && dto.getObservations() != null && !dto.getObservations().isBlank()
                        ? dto.getObservations()
                        : "Datos rectificados correctamente."
        );

        request.setStatus(ArcoStatus.RESPONDIDA);
        request.setResolvedAt(LocalDateTime.now());
        request.setResolutionSummary(detail.getResponseSummary());
        if (dto != null && dto.getResolvedByEmail() != null) {
            request.setResolvedByEmail(dto.getResolvedByEmail());
        }

        autoLiftBlock(request);
        rectificationRequestRepository.save(detail);
        ArcoRequest saved = arcoRequestRepository.save(request);
        notificarResolucion(saved);
        return saved;
    }

    @Transactional
    public ArcoRequest uploadSupportingDocument(UUID requestId, MultipartFile file) {
        ArcoRequest request = arcoRequestRepository.findById(requestId)
                .orElseThrow(() -> new ArcoRequestNotFoundException(requestId));
        try {
            request.setSupportingDocumentData(file.getBytes());
            request.setSupportingDocumentKey(file.getOriginalFilename());
        } catch (Exception e) {
            throw new RuntimeException("No se pudo guardar el documento: " + e.getMessage(), e);
        }
        return arcoRequestRepository.save(request);
    }

    public InputStream downloadSupportingDocument(UUID requestId) {
        ArcoRequest request = arcoRequestRepository.findById(requestId)
                .orElseThrow(() -> new ArcoRequestNotFoundException(requestId));
        if (request.getSupportingDocumentData() == null) {
            throw new IllegalStateException("Esta solicitud no tiene documento de respaldo adjunto.");
        }
        return new ByteArrayInputStream(request.getSupportingDocumentData());
    }

    public String getSupportingDocumentContentType(UUID requestId) {
        ArcoRequest request = arcoRequestRepository.findById(requestId)
                .orElseThrow(() -> new ArcoRequestNotFoundException(requestId));
        String name = request.getSupportingDocumentKey();
        if (name == null) return "application/octet-stream";
        if (name.endsWith(".pdf")) return "application/pdf";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".png")) return "image/png";
        return "application/octet-stream";
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

    private void autoLiftBlock(ArcoRequest request) {
        if (request.getBlockAppliedAt() != null && request.getBlockLiftedAt() == null) {
            request.setBlockLiftedAt(LocalDateTime.now());
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