package com.example.demo.service;


import com.example.demo.client.OrganizationClient;
import com.example.demo.dto.request.ArcoCancellationRequestDTO;
import com.example.demo.dto.request.ArcoRectificationRequestDTO;
import com.example.demo.dto.request.PersonRectificationRequestDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestStatusUpdateDTO;
import com.example.demo.dto.response.ArcoRequestResponseDTO;
import com.example.demo.dto.response.PersonResponseDTO;
import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoRequestChannel;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.exception.ArcoRequestNotFoundException;
import com.example.demo.model.ArcoRequest;
import com.example.demo.model.ArcoRequestStatusHistory;
import com.example.demo.model.RectificationRequest;
import com.example.demo.repository.ArcoRequestRepository;
import com.example.demo.repository.ArcoRequestStatusHistoryRepository;
import com.example.demo.repository.RectificationRequestRepository;
import com.example.demo.util.BusinessDaysCalculator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArcoRequestService {

    private final ArcoRequestRepository arcoRequestRepository;
    private final ArcoRequestStatusHistoryRepository statusHistoryRepository;
    private final ModelMapper modelMapper;
    private final OrganizationClient organizationClient;
    private final EmailService emailService;
    private final RectificationRequestRepository rectificationRequestRepository;

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
        ArcoRequest solicitud = new ArcoRequest();
        solicitud.setOrganizationId(dto.getOrganizationId());
        solicitud.setDataSubjectId(dto.getDataSubjectId());
        solicitud.setAssignedToUserId(dto.getAssignedToUserId());
        solicitud.setRequestType(dto.getRequestType());
        solicitud.setRequestChannel(dto.getRequestChannel());
        solicitud.setDescription(dto.getDescription());
        solicitud.setStatus(ArcoStatus.RECIBIDA);
        solicitud.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.PENDIENTE);
        solicitud.setSubmittedAt(LocalDateTime.now());
        solicitud.setDueDate(
                BusinessDaysCalculator.calcularFechaLimite(LocalDateTime.now(), dto.getRequestType()));
        ArcoRequest saved = arcoRequestRepository.save(solicitud);

        notificarCreacion(saved);

        return ArcoRequestResponseDTO.fromEntity(saved);    }

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

        if (dto.getNewStatus() == ArcoStatus.RESPONDIDA || dto.getNewStatus() == ArcoStatus.RECHAZADA) {
            solicitud.setResolvedAt(LocalDateTime.now());
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

        notificarCambioEstado(
                saved,
                "La verificación de identidad fue actualizada a: " + nuevoEstado
        );

        return ArcoRequestResponseDTO.fromEntity(saved);
    }

    @Transactional
    public ArcoRequestResponseDTO actualizarResolucion(UUID id, String resolutionSummary) {
        ArcoRequest solicitud = arcoRequestRepository.findById(id)
                .orElseThrow(() -> new ArcoRequestNotFoundException(id));
        solicitud.setResolutionSummary(resolutionSummary);
        return ArcoRequestResponseDTO.fromEntity(arcoRequestRepository.save(solicitud));
    }

    ///Metodos relacionados al derecho de cancelación
    ///
    /// Falta crear response para solicitud
    public ArcoRequestResponseDTO crearSolicitudCancelacion(ArcoCancellationRequestDTO requestDTO){

        organizationClient.findById(requestDTO.getOrganizationId());

        ArcoRequest arcoRequest = new ArcoRequest();
        arcoRequest.setOrganizationId(requestDTO.getOrganizationId());
        arcoRequest.setDataSubjectId(requestDTO.getDataSubjectId());
        arcoRequest.setAssignedToUserId(requestDTO.getAssignedToUserId());
        arcoRequest.setRequestChannel(ArcoRequestChannel.WEB_PORTAL);
        arcoRequest.setDescription(requestDTO.getDescription());
        arcoRequest.setCancellationActionType(requestDTO.getCancellationActionType());
        //los demas atributos de base
        arcoRequest.setStatus(ArcoStatus.RECIBIDA);
        arcoRequest.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.PENDIENTE);
        arcoRequest.setSubmittedAt(LocalDateTime.now());
        arcoRequest.setDueDate(
                BusinessDaysCalculator.calcularFechaLimite(
                        LocalDateTime.now(),
                        ArcoRequestType.CANCELLATION
                )
        );
        arcoRequest.setResolutionSummary(null);
        arcoRequest.setResolvedAt(null);
        arcoRequest.setRequestType(ArcoRequestType.CANCELLATION);

        ArcoRequest saved = arcoRequestRepository.save(arcoRequest);
        notificarCreacion(saved);
        return modelMapper.map(saved, ArcoRequestResponseDTO.class);

    }

    @Transactional
    public ArcoRequestResponseDTO ejecutarCancelacion(UUID solicitudId) {

        ArcoRequest solicitud = arcoRequestRepository.findById(solicitudId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Solicitud no existe"
                ));

        if (solicitud.getRequestType() != ArcoRequestType.CANCELLATION) {
            throw new RuntimeException("La solicitud no corresponde a cancelación");
        }

        if (solicitud.getCancellationActionType() == null) {
            throw new RuntimeException("La cancelación no tiene tipo definido");
        }

        if (solicitud.getIdentityVerificationStatus() != ArcoIdentityVerificationStatus.VERIFICADA) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La identidad del titular aún no ha sido verificada"
            );
        }

        if (solicitud.getStatus() != ArcoStatus.EN_GESTION) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La solicitud debe estar en estado EN_GESTION para poder ejecutarse"
            );
        }

        try {

            switch (solicitud.getCancellationActionType()) {
                case BLOCK -> ejecutarBloqueo(solicitud);
                case DELETE -> ejecutarEliminacion(solicitud);
                case ANONYMIZE -> ejecutarAnonimizacion(solicitud);
            }

            solicitud.setStatus(ArcoStatus.RESPONDIDA);
            solicitud.setResolvedAt(LocalDateTime.now());

            ArcoRequest saved = arcoRequestRepository.save(solicitud);
            notificarResolucion(saved);
            return modelMapper.map(saved, ArcoRequestResponseDTO.class);

        } catch (RestClientResponseException ex) {

            solicitud.setStatus(ArcoStatus.RECHAZADA);
            solicitud.setResolvedAt(LocalDateTime.now());
            solicitud.setResolutionSummary(
                    "Solicitud rechazada por la organización. " +
                            ex.getResponseBodyAsString()
            );

            ArcoRequest saved = arcoRequestRepository.save(solicitud);
            notificarResolucion(saved);
            return modelMapper.map(saved, ArcoRequestResponseDTO.class);
        }
    }

    ///en esta seccion los metodos ejecutan logica que se encuentra en organization
    /// ya que estos tratamientos los hacen ahi


    private void ejecutarBloqueo(ArcoRequest solicitud) {

        organizationClient.blockDataSubject(
                solicitud.getOrganizationId(),
                solicitud.getDataSubjectId()
        );


        solicitud.setResolutionSummary(
                "Se ejecutó la cancelación mediante bloqueo lógico. " +
                        "Los datos del titular quedan restringidos para nuevos tratamientos por parte de la organización."
        );
    }

    private void ejecutarEliminacion(ArcoRequest solicitud) {

        organizationClient.deleteDataSubject(
                solicitud.getOrganizationId(),
                solicitud.getDataSubjectId()
        );


        solicitud.setResolutionSummary(
                "Se registró la cancelación mediante eliminación lógica. " +
                        "Los datos no serán eliminados físicamente en esta etapa, pero quedan marcados como no disponibles para tratamiento."
        );
    }

    private void ejecutarAnonimizacion(ArcoRequest solicitud) {

        organizationClient.anonymizeDataSubject(
                solicitud.getOrganizationId(),
                solicitud.getDataSubjectId()
        );



        solicitud.setResolutionSummary(
                "Se ejecutó la cancelación mediante anonimización lógica. " +
                        "Los datos identificables del titular deberán ser reemplazados por valores no atribuibles directamente."
        );
    }

    ///metodo de notificaciones email
    private void notificarCreacion(ArcoRequest solicitud) {

        try {

            PersonResponseDTO personResponse =
                    organizationClient.findPersonById(
                            solicitud.getOrganizationId(),
                            solicitud.getDataSubjectId()
                    );

            String email = personResponse.getData().getEmail();

            emailService.sendRequestCreatedEmail(
                    email,
                    solicitud.getId(),
                    solicitud.getRequestType().name(),
                    solicitud.getStatus().name()
            );

        } catch (Exception ex) {
            System.out.println("No se pudo enviar correo de creación: " + ex.getMessage());
        }
    }

    private void notificarCambioEstado(
            ArcoRequest solicitud,
            String comentario
    ) {

        try {

            PersonResponseDTO personResponse =
                    organizationClient.findPersonById(
                            solicitud.getOrganizationId(),
                            solicitud.getDataSubjectId()
                    );

            String email = personResponse.getData().getEmail();

            emailService.sendStatusChangedEmail(
                    email,
                    solicitud.getId(),
                    solicitud.getStatus().name(),
                    comentario
            );

        } catch (Exception ex) {
            System.out.println("No se pudo enviar correo de cambio de estado: " + ex.getMessage());
        }
    }

    private void notificarResolucion(ArcoRequest solicitud) {

        try {

            PersonResponseDTO personResponse =
                    organizationClient.findPersonById(
                            solicitud.getOrganizationId(),
                            solicitud.getDataSubjectId()
                    );

            String email = personResponse.getData().getEmail();

            emailService.sendResolutionEmail(
                    email,
                    solicitud.getId(),
                    solicitud.getStatus().name(),
                    solicitud.getResolutionSummary()
            );

        } catch (Exception ex) {
            System.out.println("No se pudo enviar correo de resolución: " + ex.getMessage());
        }
    }

    ///Metodo relacionados al derecho de Rectificaion
    public ArcoRequestResponseDTO crearSolicitudRectificacion(ArcoRectificationRequestDTO requestDTO){
        organizationClient.findById(requestDTO.getOrganizationId());

        ArcoRequest arcoRequest = new ArcoRequest();
        arcoRequest.setOrganizationId(requestDTO.getOrganizationId());
        arcoRequest.setDataSubjectId(requestDTO.getDataSubjectId());
        arcoRequest.setAssignedToUserId(requestDTO.getAssignedToUserId());
        arcoRequest.setRequestChannel(ArcoRequestChannel.WEB_PORTAL);
        arcoRequest.setDescription(requestDTO.getDescription());
        arcoRequest.setCancellationActionType(null);
        //los demas atributos de base
        arcoRequest.setStatus(ArcoStatus.RECIBIDA);
        arcoRequest.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.PENDIENTE);
        arcoRequest.setSubmittedAt(LocalDateTime.now());
        arcoRequest.setDueDate(
                BusinessDaysCalculator.calcularFechaLimite(
                        LocalDateTime.now(),
                        ArcoRequestType.RECTIFICACION
                )
        );
        arcoRequest.setResolutionSummary(null);
        arcoRequest.setResolvedAt(null);
        arcoRequest.setRequestType(ArcoRequestType.RECTIFICACION);

        ArcoRequest saved = arcoRequestRepository.save(arcoRequest);

        RectificationRequest rectificationRequest =
                new RectificationRequest();

        rectificationRequest.setId(UUID.randomUUID());
        rectificationRequest.setArcoRequest(saved);

        rectificationRequest.setFirstName(requestDTO.getFirstName());
        rectificationRequest.setLastName(requestDTO.getLastName());
        rectificationRequest.setEmail(requestDTO.getEmail());
        rectificationRequest.setPhone(requestDTO.getPhone());
        rectificationRequest.setPosition(requestDTO.getPosition());
        rectificationRequest.setRut(requestDTO.getRut());

        rectificationRequestRepository.save(rectificationRequest);
        notificarCreacion(saved);
        return modelMapper.map(saved, ArcoRequestResponseDTO.class);
    }

    public ArcoRequestResponseDTO ejecutarRectificacion(UUID solicitudId){
        ArcoRequest solicitud = arcoRequestRepository.findById(solicitudId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Solicitud no existe"
                ));


        if (solicitud.getRequestType() != ArcoRequestType.RECTIFICACION) {
            throw new RuntimeException("La solicitud no corresponde a cancelación");
        }


        if (solicitud.getIdentityVerificationStatus() != ArcoIdentityVerificationStatus.VERIFICADA) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La identidad del titular aún no ha sido verificada"
            );
        }

        if (solicitud.getStatus() != ArcoStatus.EN_GESTION) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La solicitud debe estar en estado EN_GESTION para poder ejecutarse"
            );
        }

        RectificationRequest rectificationRequest =
                rectificationRequestRepository
                        .findByArcoRequest_Id(solicitudId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "No existe información de rectificación asociada"
                        ));

        try {
            PersonRectificationRequestDTO requestDTO =
                    new PersonRectificationRequestDTO();

            requestDTO.setFirstName(rectificationRequest.getFirstName());
            requestDTO.setLastName(rectificationRequest.getLastName());
            requestDTO.setEmail(rectificationRequest.getEmail());
            requestDTO.setPhone(rectificationRequest.getPhone());
            requestDTO.setPosition(rectificationRequest.getPosition());
            requestDTO.setRut(rectificationRequest.getRut());

            organizationClient.rectificationDataSubject(
                    solicitud.getOrganizationId(),
                    solicitud.getDataSubjectId(),
                    requestDTO
            );

            solicitud.setStatus(ArcoStatus.RESPONDIDA);
            solicitud.setResolvedAt(LocalDateTime.now());

            solicitud.setResolutionSummary(
                    "La rectificación de los datos personales fue ejecutada correctamente."
            );

            ArcoRequest saved = arcoRequestRepository.save(solicitud);

            notificarResolucion(saved);

            return modelMapper.map(
                    saved,
                    ArcoRequestResponseDTO.class
            );

        } catch (RestClientResponseException ex) {

            solicitud.setStatus(ArcoStatus.RECHAZADA);
            solicitud.setResolvedAt(LocalDateTime.now());

            System.out.println("Error Organization Service: " + ex.getResponseBodyAsString());

            solicitud.setResolutionSummary(
                    "Solicitud rechazada por la organización. " +
                            "No fue posible ejecutar la rectificación solicitada debido a una validación de los datos enviados."
            );

            ArcoRequest saved = arcoRequestRepository.save(solicitud);
            notificarResolucion(saved);

            return modelMapper.map(saved, ArcoRequestResponseDTO.class);
        }

    }
}
