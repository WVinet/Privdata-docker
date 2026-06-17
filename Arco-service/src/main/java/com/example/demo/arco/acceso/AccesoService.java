package com.example.demo.arco.acceso;

import com.example.demo.arco.acceso.dto.AccessResponseDTO;
import com.example.demo.arco.acceso.enums.AccessStatus;
import com.example.demo.arco.acceso.model.AccessRequest;
import com.example.demo.arco.acceso.repository.AccessRequestRepository;
import com.example.demo.arco.common.dto.VerifyIdentityDTO;
import com.example.demo.client.OrganizationClient;
import com.example.demo.arco.common.service.EmailService;
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
public class AccesoService {

    private final AccessRequestRepository accessRequestRepository;
    private final ArcoRequestRepository arcoRequestRepository;
    private final OrganizationClient organizationClient;
    private final EmailService emailService;

    @Transactional
    public ArcoRequest crear(ArcoRequestCreateDTO dto) {

        LocalDateTime fromDate = LocalDateTime.now().minusDays(30);

        long accessRequestsCount =
                arcoRequestRepository.countByDataSubjectIdAndOrganizationIdAndRequestTypeAndSubmittedAtAfter(
                        dto.getDataSubjectId(),
                        dto.getOrganizationId(),
                        ArcoRequestType.ACCESO,
                        fromDate
                );

        if (accessRequestsCount >= 3) {

            ArcoRequest rejected = new ArcoRequest();

            rejected.setOrganizationId(dto.getOrganizationId());
            rejected.setDataSubjectId(dto.getDataSubjectId());
            rejected.setAssignedToUserId(dto.getAssignedToUserId());
            rejected.setRequestType(dto.getRequestType());
            rejected.setRequestChannel(dto.getRequestChannel());
            rejected.setDescription(dto.getDescription());

            rejected.setStatus(ArcoStatus.RECHAZADA);
            rejected.setIdentityVerificationStatus(
                    ArcoIdentityVerificationStatus.VERIFICADA);

            rejected.setSubmittedAt(LocalDateTime.now());
            rejected.setResolvedAt(LocalDateTime.now());

            rejected.setResolutionSummary(
                    "Solicitud rechazada por exceso de solicitudes de acceso."
            );
            rejected.setAgencyClaimDeadline(
                    LocalDateTime.now().plusDays(30)
            );

            ArcoRequest savedRejected = arcoRequestRepository.save(rejected);
            notificarResolucion(savedRejected);
            return savedRejected;
        }

        ArcoRequest solicitud = new ArcoRequest();
        solicitud.setOrganizationId(dto.getOrganizationId());
        solicitud.setDataSubjectId(dto.getDataSubjectId());
        solicitud.setAssignedToUserId(dto.getAssignedToUserId());
        solicitud.setRequestType(dto.getRequestType());
        solicitud.setRequestChannel(dto.getRequestChannel());
        solicitud.setDescription(dto.getDescription());
        solicitud.setStatus(ArcoStatus.RECIBIDA);
        solicitud.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.PENDIENTE);


        LocalDateTime now = LocalDateTime.now();
        solicitud.setSubmittedAt(now);
        solicitud.setDueDate(BusinessDaysCalculator.calcularFechaLimite(now, dto.getRequestType()));

        ArcoRequest saved = arcoRequestRepository.save(solicitud);

        AccessRequest accessRequest = AccessRequest.builder()
                .arcoRequest(saved)
                .accessStatus(AccessStatus.IDENTIDAD_PENDIENTE)
                .requestedInformation(dto.getDescription())
                .dataFound(null)
                .build();

        accessRequestRepository.save(accessRequest);
        notificarCreacion(saved);
        return saved;


    }

    @Transactional
    public ArcoRequest verifyIdentity(UUID requestId, boolean verified, String comment) {

        ArcoRequest request = arcoRequestRepository.findById(requestId)
                .orElseThrow(() -> new ArcoRequestNotFoundException(requestId));

        if (request.getRequestType() != ArcoRequestType.ACCESO) {
            throw new IllegalArgumentException("La solicitud no corresponde al derecho de acceso.");
        }

        if (request.getIdentityVerificationStatus() != ArcoIdentityVerificationStatus.PENDIENTE) {
            throw new IllegalStateException("La identidad ya fue resuelta.");
        }

        if (verified) {
            request.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.VERIFICADA);
            request.setStatus(ArcoStatus.EN_GESTION);
        } else {
            request.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.RECHAZADA);
            request.setStatus(ArcoStatus.RECHAZADA);
            request.setResolvedAt(LocalDateTime.now());
            request.setResolutionSummary(
                    comment != null && !comment.isBlank()
                            ? comment
                            : "Solicitud rechazada por no poder verificar la identidad del titular."
            );

            request.setAgencyClaimDeadline(
                    BusinessDaysCalculator.calcularFechaLimite(LocalDateTime.now(), request.getRequestType())
            );
        }

        ArcoRequest saved = arcoRequestRepository.save(request);
        String notificationComment = comment;

        if (notificationComment == null || notificationComment.isBlank()) {
            notificationComment = verified
                    ? "La identidad del titular ha sido verificada correctamente."
                    : "No fue posible verificar la identidad del titular.";
        }

        notificarCambioEstado(saved, notificationComment);
        return saved;
    }

    @Transactional
    public ArcoRequest respondRequest(UUID requestId, AccessResponseDTO dto) {

        AccessRequest accessRequest =
                accessRequestRepository.findByArcoRequest_Id(requestId)
                        .orElseThrow(() ->
                                new ArcoRequestNotFoundException(requestId));

        ArcoRequest request = accessRequest.getArcoRequest();

        if (request.getStatus() != ArcoStatus.EN_GESTION) {
            throw new IllegalStateException(
                    "La solicitud no se encuentra en gestión."
            );
        }

        PersonResponseDTO person = organizationClient.findPersonById(
                request.getOrganizationId(),
                request.getDataSubjectId()
        );

        if (person != null && person.getData() != null) {

            accessRequest.setDataFound(true);

            accessRequest.setPersonalDataFound(
                    "Nombre: " + person.getData().getFullName()
                            + ", Email: " + person.getData().getEmail()
            );

        } else {

            accessRequest.setDataFound(false);

            accessRequest.setPersonalDataFound(
                    "No se encontraron datos personales asociados al titular."
            );
        }

        accessRequest.setResponseSummary(
                dto != null && dto.getObservations() != null && !dto.getObservations().isBlank()
                        ? dto.getObservations()
                        : "Respuesta generada desde organization-service."
        );

        request.setStatus(ArcoStatus.RESPONDIDA);
        request.setResolvedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(accessRequest.getDataFound())) {
            request.setResolutionSummary(
                    "Se entregó la información personal disponible del titular."
            );
        } else {
            request.setResolutionSummary(
                    "No se encontraron datos personales asociados al titular."
            );
        }

        accessRequestRepository.save(accessRequest);

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
