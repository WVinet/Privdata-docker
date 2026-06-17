package com.example.demo.arco.rectificacion.service;

import com.example.demo.arco.common.dto.VerifyIdentityDTO;
import com.example.demo.arco.rectificacion.dto.RectificationResponseDTO;
import com.example.demo.arco.rectificacion.enums.RectificationStatus;
import com.example.demo.arco.rectificacion.model.RectificationRequest;
import com.example.demo.arco.rectificacion.repository.RectificationRequestRepository;
import com.example.demo.client.OrganizationClient;
import com.example.demo.arco.common.service.EmailService;
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

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RectificacionService {

    private final ArcoRequestRepository arcoRequestRepository;
    private final RectificationRequestRepository rectificationRequestRepository;
    private final OrganizationClient organizationClient;
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
            detail.setRectificationStatus(RectificationStatus.EN_GESTION);
        } else {
            request.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.RECHAZADA);
            request.setStatus(ArcoStatus.RECHAZADA);
            request.setResolvedAt(LocalDateTime.now());
            request.setResolutionSummary(dto.getComment());
            detail.setRectificationStatus(RectificationStatus.IDENTIDAD_RECHAZADA);
        }

        rectificationRequestRepository.save(detail);
        ArcoRequest saved = arcoRequestRepository.save(request);
        String notificationComment = dto.getComment();

        if (notificationComment == null || notificationComment.isBlank()) {
            notificationComment = Boolean.TRUE.equals(dto.getVerified())
                    ? "La identidad del titular ha sido verificada correctamente."
                    : "No fue posible verificar la identidad del titular.";
        }

        notificarCambioEstado(saved, notificationComment);
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

        detail.setRectificationStatus(RectificationStatus.RESPONDIDA);
        detail.setResponseSummary(
                dto != null && dto.getObservations() != null && !dto.getObservations().isBlank()
                        ? dto.getObservations()
                        : "Datos rectificados correctamente."
        );

        request.setStatus(ArcoStatus.RESPONDIDA);
        request.setResolvedAt(LocalDateTime.now());
        request.setResolutionSummary(detail.getResponseSummary());

        rectificationRequestRepository.save(detail);
        ArcoRequest saved = arcoRequestRepository.save(request);
        notificarResolucion(saved);
        return saved;
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