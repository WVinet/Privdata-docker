package com.example.demo.arco.common.service;


import com.example.demo.arco.common.factory.ArcoRequestFactory;
import com.example.demo.client.AgenciaClient;
import com.example.demo.client.OrganizationClient;
import com.example.demo.dto.request.ArcoCancellationRequestDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestStatusUpdateDTO;
import com.example.demo.dto.response.AgencyClaimResponseDTO;
import com.example.demo.dto.response.ArcoRequestResponseDTO;
import com.example.demo.dto.response.PersonResponseDTO;
import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoRequestChannel;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.exception.ArcoRequestNotFoundException;
import com.example.demo.model.ArcoRequest;
import com.example.demo.model.ArcoRequestStatusHistory;
import com.example.demo.repository.ArcoRequestRepository;
import com.example.demo.repository.ArcoRequestStatusHistoryRepository;
import com.example.demo.shared.service.DeadlineCalculatorService;
import com.example.demo.util.BusinessDaysCalculator;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ArcoRequestService {

    private final ArcoRequestRepository arcoRequestRepository;
    private final ArcoRequestStatusHistoryRepository statusHistoryRepository;
    private final ModelMapper modelMapper;
    private final OrganizationClient organizationClient;
    private final AgenciaClient agenciaClient;
    private final EmailService emailService;
    private final DeadlineCalculatorService deadlineCalculatorService;
    private final Map<ArcoRequestType, ArcoRequestFactory> factories;

    public ArcoRequestService(ArcoRequestRepository arcoRequestRepository,
                               ArcoRequestStatusHistoryRepository statusHistoryRepository,
                               ModelMapper modelMapper,
                               OrganizationClient organizationClient,
                               AgenciaClient agenciaClient,
                               EmailService emailService,
                               DeadlineCalculatorService deadlineCalculatorService,
                               List<ArcoRequestFactory> factoryList) {
        this.arcoRequestRepository = arcoRequestRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.modelMapper = modelMapper;
        this.organizationClient = organizationClient;
        this.agenciaClient = agenciaClient;
        this.emailService = emailService;
        this.deadlineCalculatorService = deadlineCalculatorService;
        this.factories = factoryList.stream()
                .collect(Collectors.toMap(ArcoRequestFactory::getTipo, Function.identity()));
    }

    public List<ArcoRequestResponseDTO> listar() {
        return arcoRequestRepository.findAll().stream()
                .map(ArcoRequestResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public ArcoRequestResponseDTO buscarPorId(UUID id) {
        return ArcoRequestResponseDTO.fromEntity(
                arcoRequestRepository.findById(id)
                        .orElseThrow(() -> new ArcoRequestNotFoundException(id))
        );
    }

    public List<ArcoRequestResponseDTO> listarPorOrganizacion(UUID organizationId) {
        return arcoRequestRepository.findByOrganizationId(organizationId).stream()
                .map(ArcoRequestResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ArcoRequestResponseDTO> listarPorTitular(UUID dataSubjectId) {
        return arcoRequestRepository.findByDataSubjectId(dataSubjectId).stream()
                .map(ArcoRequestResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ArcoRequestResponseDTO> listarPorEstado(ArcoStatus status) {
        return arcoRequestRepository.findByStatus(status).stream()
                .map(ArcoRequestResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ArcoRequestResponseDTO crearSolicitud(ArcoRequestCreateDTO dto) {
        ArcoRequestFactory factory = factories.get(dto.getRequestType());
        if (factory == null) {
            throw new IllegalArgumentException(
                "Tipo de solicitud no soportado: " + dto.getRequestType());
        }
        ArcoRequest saved = factory.crear(dto);
        notificarCreacion(saved);
        return ArcoRequestResponseDTO.fromEntity(saved);
    }

    @Transactional
    public ArcoRequestResponseDTO cambiarEstado(UUID id, ArcoRequestStatusUpdateDTO dto) {
        ArcoRequest solicitud = arcoRequestRepository.findById(id)
                .orElseThrow(() -> new ArcoRequestNotFoundException(id));
        ArcoStatus estadoAnterior = solicitud.getStatus();

        if (dto.getNewStatus() == ArcoStatus.RESPONDIDA && (dto.getComment() == null || dto.getComment().isBlank())) {
            throw new IllegalArgumentException("Debe registrar el contenido de la respuesta entregada al titular (Art. 11 Ley 21.719).");
        }

        if (dto.getNewStatus() == ArcoStatus.RECHAZADA) {
            if (dto.getComment() == null || dto.getComment().isBlank()) {
                throw new IllegalArgumentException("Debe indicar el motivo de la denegación.");
            }
            if (dto.getDenialLegalBasis() == null || dto.getDenialLegalBasis().isBlank()) {
                throw new IllegalArgumentException("Debe citar la norma legal que fundamenta la denegación (Art. 5° Ley 21.719).");
            }
            solicitud.setDenialLegalBasis(dto.getDenialLegalBasis());
        }

        solicitud.setStatus(dto.getNewStatus());

        if (dto.getComment() != null && !dto.getComment().isBlank()) {
            solicitud.setResolutionSummary(dto.getComment());
        }

        // RF-ARCO-CIE-01: calcular plazo de reclamo ante la Agencia al resolver
        if (dto.getNewStatus() == ArcoStatus.RESPONDIDA || dto.getNewStatus() == ArcoStatus.RECHAZADA) {
            solicitud.setResolvedAt(LocalDateTime.now());
            solicitud.setAgencyClaimDeadline(
                deadlineCalculatorService.addBusinessDays(LocalDateTime.now(), 30)
            );
            if (dto.getChangedByEmail() != null && !dto.getChangedByEmail().isBlank()) {
                solicitud.setResolvedByEmail(dto.getChangedByEmail());
            }
        }

        // RF-ARCO-10: registrar si se notificó a terceros
        if (dto.getThirdPartiesNotified() != null) {
            solicitud.setThirdPartiesNotified(dto.getThirdPartiesNotified());
        }

        ArcoRequestStatusHistory historial = new ArcoRequestStatusHistory();
        historial.setArcoRequest(solicitud);
        historial.setChangedByUserId(dto.getChangedByUserId());
        historial.setPreviousStatus(estadoAnterior);
        historial.setNewStatus(dto.getNewStatus());
        historial.setComment(dto.getComment());
        statusHistoryRepository.save(historial);

        ArcoRequest saved = arcoRequestRepository.save(solicitud);
        notificarCambioEstado(saved, dto.getComment());
        return ArcoRequestResponseDTO.fromEntity(saved);
    }

    // RF-ARCO-CIE-03: titular registra disconformidad desde el portal
    @Transactional
    public ArcoRequestResponseDTO registrarDisconformidadTitular(UUID id, String motivo) {
        ArcoRequest solicitud = arcoRequestRepository.findById(id)
                .orElseThrow(() -> new ArcoRequestNotFoundException(id));

        if (!List.of(ArcoStatus.RESPONDIDA, ArcoStatus.RECHAZADA).contains(solicitud.getStatus())) {
            throw new IllegalStateException("Solo puedes registrar disconformidad en solicitudes ya resueltas.");
        }

        if (solicitud.isTitularDisconforme()) {
            throw new IllegalStateException("Ya registraste disconformidad en esta solicitud.");
        }

        solicitud.setTitularDisconforme(true);

        ArcoRequestStatusHistory historial = new ArcoRequestStatusHistory();
        historial.setArcoRequest(solicitud);
        historial.setPreviousStatus(solicitud.getStatus());
        historial.setNewStatus(solicitud.getStatus());
        historial.setComment("[TITULAR DISCONFORME] " +
                (motivo != null && !motivo.isBlank() ? motivo : "El titular indicó que no está conforme con la resolución."));
        statusHistoryRepository.save(historial);

        return ArcoRequestResponseDTO.fromEntity(arcoRequestRepository.save(solicitud));
    }

    // El titular escala su disconformidad como reclamo formal ante la Agencia (Agencia-service)
    @Transactional
    public ArcoRequestResponseDTO reclamarAnteAgencia(UUID id) {
        ArcoRequest solicitud = arcoRequestRepository.findById(id)
                .orElseThrow(() -> new ArcoRequestNotFoundException(id));

        if (!List.of(ArcoStatus.RESPONDIDA, ArcoStatus.RECHAZADA).contains(solicitud.getStatus())) {
            throw new IllegalArgumentException("Solo puedes reclamar ante la Agencia sobre solicitudes ya resueltas.");
        }
        if (!solicitud.isTitularDisconforme()) {
            throw new IllegalArgumentException("Primero debes registrar tu disconformidad con la resolución.");
        }
        if (solicitud.getAgencyClaimId() != null) {
            throw new IllegalArgumentException("Ya existe un reclamo registrado ante la Agencia para esta solicitud.");
        }
        if (solicitud.getAgencyClaimDeadline() != null && LocalDateTime.now().isAfter(solicitud.getAgencyClaimDeadline())) {
            throw new IllegalArgumentException("El plazo para reclamar ante la Agencia ya venció.");
        }

        String motivo = statusHistoryRepository.findByArcoRequest_IdOrderByChangedAtAsc(id).stream()
                .filter(h -> h.getComment() != null && h.getComment().startsWith("[TITULAR DISCONFORME]"))
                .reduce((first, second) -> second)
                .map(h -> h.getComment().replaceFirst("^\\[TITULAR DISCONFORME\\]\\s*", ""))
                .orElse("El titular no está conforme con la resolución.");

        PersonResponseDTO personResponse = organizationClient.findPersonById(solicitud.getOrganizationId(), solicitud.getDataSubjectId());

        AgencyClaimResponseDTO respuesta = agenciaClient.crearReclamo(
                solicitud.getId(),
                solicitud.getOrganizationId(),
                solicitud.getDataSubjectId(),
                personResponse.getData().getFullName(),
                personResponse.getData().getEmail(),
                solicitud.getRequestType().name(),
                solicitud.getResolutionSummary(),
                solicitud.getDenialLegalBasis(),
                solicitud.getResolvedByEmail(),
                motivo,
                LocalDateTime.now());

        solicitud.setAgencyClaimId(respuesta.getId());

        ArcoRequestStatusHistory historial = new ArcoRequestStatusHistory();
        historial.setArcoRequest(solicitud);
        historial.setPreviousStatus(solicitud.getStatus());
        historial.setNewStatus(solicitud.getStatus());
        historial.setComment("[RECLAMO_AGENCIA] Reclamo registrado ante la Agencia, ID: " + respuesta.getId());
        statusHistoryRepository.save(historial);

        return ArcoRequestResponseDTO.fromEntity(arcoRequestRepository.save(solicitud));
    }

    // Callback server-to-server desde Agencia-service cuando el auditor responde el reclamo
    @Transactional
    public ArcoRequestResponseDTO registrarRespuestaAgencia(UUID id, String response, LocalDateTime respondedAt) {
        ArcoRequest solicitud = arcoRequestRepository.findById(id)
                .orElseThrow(() -> new ArcoRequestNotFoundException(id));

        ArcoStatus estadoAnterior = solicitud.getStatus();

        solicitud.setAgencyResolution(response);
        solicitud.setAgencyRespondedAt(respondedAt != null ? respondedAt : LocalDateTime.now());
        solicitud.setStatus(ArcoStatus.CERRADA);
        solicitud.setClosedAt(LocalDateTime.now());

        ArcoRequestStatusHistory historial = new ArcoRequestStatusHistory();
        historial.setArcoRequest(solicitud);
        historial.setPreviousStatus(estadoAnterior);
        historial.setNewStatus(ArcoStatus.CERRADA);
        historial.setComment("[RESPUESTA_AGENCIA] " + response);
        statusHistoryRepository.save(historial);

        return ArcoRequestResponseDTO.fromEntity(arcoRequestRepository.save(solicitud));
    }

    @Transactional
    public ArcoRequestResponseDTO prorrogarPlazo(UUID id) {
        ArcoRequest solicitud = arcoRequestRepository.findById(id)
                .orElseThrow(() -> new ArcoRequestNotFoundException(id));

        if (solicitud.isExtensionGranted()) {
            throw new IllegalArgumentException("Esta solicitud ya cuenta con una prórroga otorgada (Art. 11 Ley 21.719 permite una sola).");
        }

        if (solicitud.getStatus() == ArcoStatus.RESPONDIDA
                || solicitud.getStatus() == ArcoStatus.RECHAZADA
                || solicitud.getStatus() == ArcoStatus.CERRADA) {
            throw new IllegalArgumentException("No se puede prorrogar una solicitud en estado " + solicitud.getStatus() + ".");
        }

        solicitud.setExtensionGranted(true);
        solicitud.setExtendedDueDate(solicitud.getDueDate().plusDays(30));
        return ArcoRequestResponseDTO.fromEntity(arcoRequestRepository.save(solicitud));
    }

    @Transactional
    public ArcoRequestResponseDTO actualizarVerificacionIdentidad(UUID id,
                                                                  ArcoIdentityVerificationStatus nuevoEstado) {
        ArcoRequest solicitud = arcoRequestRepository.findById(id)
                .orElseThrow(() -> new ArcoRequestNotFoundException(id));

        solicitud.setIdentityVerificationStatus(nuevoEstado);
        ArcoRequest saved = arcoRequestRepository.save(solicitud);
        notificarCambioEstado(saved, "La verificación de identidad fue actualizada a: " + nuevoEstado);
        return ArcoRequestResponseDTO.fromEntity(saved);
    }


    @Transactional
    public ArcoRequestResponseDTO actualizarResolucion(UUID id, String resolutionSummary) {
        ArcoRequest solicitud = arcoRequestRepository.findById(id)
                .orElseThrow(() -> new ArcoRequestNotFoundException(id));
        solicitud.setResolutionSummary(resolutionSummary);
        return ArcoRequestResponseDTO.fromEntity(arcoRequestRepository.save(solicitud));
    }

    public ArcoRequestResponseDTO crearSolicitudCancelacion(ArcoCancellationRequestDTO requestDTO) {
        organizationClient.findById(requestDTO.getOrganizationId());

        ArcoRequest arcoRequest = new ArcoRequest();
        arcoRequest.setOrganizationId(requestDTO.getOrganizationId());
        arcoRequest.setDataSubjectId(requestDTO.getDataSubjectId());
        arcoRequest.setAssignedToUserId(requestDTO.getAssignedToUserId());
        arcoRequest.setRequestChannel(ArcoRequestChannel.WEB_PORTAL);
        arcoRequest.setDescription(requestDTO.getDescription());
        arcoRequest.setCancellationActionType(requestDTO.getCancellationActionType());
        arcoRequest.setStatus(ArcoStatus.RECIBIDA);
        arcoRequest.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.PENDIENTE);
        arcoRequest.setSubmittedAt(LocalDateTime.now());
        arcoRequest.setDueDate(BusinessDaysCalculator.calcularFechaLimite(LocalDateTime.now(), ArcoRequestType.SUPRESION));
        arcoRequest.setResolutionSummary(null);
        arcoRequest.setResolvedAt(null);
        arcoRequest.setRequestType(ArcoRequestType.SUPRESION);

        ArcoRequest saved = arcoRequestRepository.save(arcoRequest);
        notificarCreacion(saved);
        return modelMapper.map(saved, ArcoRequestResponseDTO.class);
    }

    @Transactional
    public ArcoRequestResponseDTO ejecutarCancelacion(UUID solicitudId) {
        ArcoRequest solicitud = arcoRequestRepository.findById(solicitudId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud no existe"));

        if (solicitud.getRequestType() != ArcoRequestType.SUPRESION) {
            throw new RuntimeException("La solicitud no corresponde a cancelación");
        }
        if (solicitud.getCancellationActionType() == null) {
            throw new RuntimeException("La cancelación no tiene tipo definido");
        }
        if (solicitud.getIdentityVerificationStatus() != ArcoIdentityVerificationStatus.VERIFICADA) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La identidad del titular aún no ha sido verificada");
        }
        if (solicitud.getStatus() != ArcoStatus.EN_GESTION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La solicitud debe estar en estado EN_GESTION para poder ejecutarse");
        }

        try {
            switch (solicitud.getCancellationActionType()) {
                case BLOCK    -> ejecutarBloqueo(solicitud);
                case DELETE   -> ejecutarEliminacion(solicitud);
                case ANONYMIZE -> ejecutarAnonimizacion(solicitud);
            }
            solicitud.setStatus(ArcoStatus.RESPONDIDA);
            solicitud.setResolvedAt(LocalDateTime.now());
            solicitud.setAgencyClaimDeadline(deadlineCalculatorService.addBusinessDays(LocalDateTime.now(), 30));

            ArcoRequest saved = arcoRequestRepository.save(solicitud);
            notificarResolucion(saved);
            return modelMapper.map(saved, ArcoRequestResponseDTO.class);

        } catch (RestClientResponseException ex) {
            solicitud.setStatus(ArcoStatus.RECHAZADA);
            solicitud.setResolvedAt(LocalDateTime.now());
            solicitud.setAgencyClaimDeadline(deadlineCalculatorService.addBusinessDays(LocalDateTime.now(), 30));
            solicitud.setResolutionSummary("Solicitud rechazada por la organización. " + ex.getResponseBodyAsString());

            ArcoRequest saved = arcoRequestRepository.save(solicitud);
            notificarResolucion(saved);
            return modelMapper.map(saved, ArcoRequestResponseDTO.class);
        }
    }

    private void ejecutarBloqueo(ArcoRequest solicitud) {
        organizationClient.blockDataSubject(solicitud.getOrganizationId(), solicitud.getDataSubjectId());
        solicitud.setResolutionSummary("Se ejecutó la cancelación mediante bloqueo lógico. Los datos del titular quedan restringidos para nuevos tratamientos.");
    }

    private void ejecutarEliminacion(ArcoRequest solicitud) {
        organizationClient.deleteDataSubject(solicitud.getOrganizationId(), solicitud.getDataSubjectId());
        solicitud.setResolutionSummary("Se registró la cancelación mediante eliminación lógica. Los datos quedan marcados como no disponibles para tratamiento.");
    }

    private void ejecutarAnonimizacion(ArcoRequest solicitud) {
        organizationClient.anonymizeDataSubject(solicitud.getOrganizationId(), solicitud.getDataSubjectId());
        solicitud.setResolutionSummary("Se ejecutó la cancelación mediante anonimización lógica. Los datos identificables serán reemplazados por valores no atribuibles.");
    }

    private void notificarCreacion(ArcoRequest solicitud) {
        try {
            PersonResponseDTO personResponse = organizationClient.findPersonById(solicitud.getOrganizationId(), solicitud.getDataSubjectId());
            emailService.sendRequestCreatedEmail(personResponse.getData().getEmail(), solicitud.getId(), solicitud.getRequestType().name(), solicitud.getStatus().name());
        } catch (Exception ex) {
            System.out.println("No se pudo enviar correo de creación: " + ex.getMessage());
        }
    }

    private void notificarCambioEstado(ArcoRequest solicitud, String comentario) {
        try {
            PersonResponseDTO personResponse = organizationClient.findPersonById(solicitud.getOrganizationId(), solicitud.getDataSubjectId());
            emailService.sendStatusChangedEmail(personResponse.getData().getEmail(), solicitud.getId(), solicitud.getStatus().name(), comentario);
        } catch (Exception ex) {
            System.out.println("No se pudo enviar correo de cambio de estado: " + ex.getMessage());
        }
    }

    private void notificarResolucion(ArcoRequest solicitud) {
        try {
            PersonResponseDTO personResponse = organizationClient.findPersonById(solicitud.getOrganizationId(), solicitud.getDataSubjectId());
            emailService.sendResolutionEmail(personResponse.getData().getEmail(), solicitud.getId(), solicitud.getStatus().name(), solicitud.getResolutionSummary());
        } catch (Exception ex) {
            System.out.println("No se pudo enviar correo de resolución: " + ex.getMessage());
        }
    }
}
