package com.example.demo.service;

import com.example.demo.client.OrganizationClient;
import com.example.demo.dto.request.ArcoCancellationRequestDTO;
import com.example.demo.dto.response.ArcoRequestActionResponseDTO;
import com.example.demo.dto.response.ArcoResponseDTO;
import com.example.demo.dto.request.CreateArcoRequestDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.dto.response.ArcoRequestResponseDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestStatusUpdateDTO;
import com.example.demo.dto.response.OrgResponseDTO;
import com.example.demo.enums.arcoRequest.*;
import com.example.demo.exception.ArcoRequestNotFoundException;
import com.example.demo.model.ArcoRequest;
import com.example.demo.model.ArcoRequestStatusHistory;
import com.example.demo.repository.ArcoRequestRepository;
import com.example.demo.repository.ArcoRequestStatusHistoryRepository;
import com.example.demo.util.BusinessDaysCalculator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
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

    public ArcoResponseDTO registrarSolicitud(CreateArcoRequestDTO dto) {
        ArcoRequest req = new ArcoRequest();
        req.setOrganizationId(dto.getOrganizationId());
        req.setDataSubjectId(dto.getDataSubjectId());
        req.setAssignedToUserId(dto.getAssignedToUserId());
        req.setRequestType(dto.getRequestType());
        req.setStatus(ArcoStatus.RECIBIDA);
        req.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.PENDIENTE);
        req.setRequestChannel(dto.getRequestChannel());
        LocalDateTime now = LocalDateTime.now();
        req.setSubmittedAt(now);
        req.setDueDate(now.plusDays(30));
        req.setDescription(dto.getDescription());
        req.setResolutionSummary(null);
        req.setResolvedAt(null);
        return modelMapper.map(arcoRequestRepository.save(req), ArcoResponseDTO.class);
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
        return ArcoRequestResponseDTO.fromEntity(arcoRequestRepository.save(solicitud));
    }

    @Transactional
    public ArcoRequestResponseDTO cambiarEstado(UUID id, ArcoRequestStatusUpdateDTO dto) {
        ArcoRequest solicitud = arcoRequestRepository.findById(id)
                .orElseThrow(() -> new ArcoRequestNotFoundException(id));
        ArcoStatus estadoAnterior = solicitud.getStatus();

        solicitud.setStatus(dto.getNewStatus());

        if (dto.getNewStatus() == ArcoStatus.RESPONDIDA || dto.getNewStatus() == ArcoStatus.RECHAZADA) {
            solicitud.setResolvedAt(LocalDateTime.now());
        }

        arcoRequestRepository.save(solicitud);

        ArcoRequestStatusHistory historial = new ArcoRequestStatusHistory();
        historial.setArcoRequest(solicitud);
        historial.setChangedByUserId(dto.getChangedByUserId());
        historial.setPreviousStatus(estadoAnterior);
        historial.setNewStatus(dto.getNewStatus());
        historial.setComment(dto.getComment());
        statusHistoryRepository.save(historial);

        return ArcoRequestResponseDTO.fromEntity(solicitud);
    }

    @Transactional
    public ArcoRequestResponseDTO actualizarVerificacionIdentidad(UUID id, ArcoIdentityVerificationStatus nuevoEstado) {
        ArcoRequest solicitud = arcoRequestRepository.findById(id)
                .orElseThrow(() -> new ArcoRequestNotFoundException(id));
        solicitud.setIdentityVerificationStatus(nuevoEstado);
        return ArcoRequestResponseDTO.fromEntity(arcoRequestRepository.save(solicitud));
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

        organizationClient.findByid(requestDTO.getOrganizationId());

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
        arcoRequest.setDueDate(LocalDateTime.now().plusDays(2));
        arcoRequest.setResolutionSummary(null);
        arcoRequest.setResolvedAt(null);
        arcoRequest.setRequestType(ArcoRequestType.CANCELLATION);


        return modelMapper.map(
                arcoRequestRepository.save(arcoRequest), ArcoRequestResponseDTO.class);
    }

    @Transactional
    public ArcoRequestResponseDTO ejecutarCancelacion(UUID solicitudId){

        ArcoRequest solicitud = arcoRequestRepository.findById(solicitudId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Solicitud no existe"
                ));

        if(solicitud.getRequestType() != ArcoRequestType.CANCELLATION){
            throw new RuntimeException("La solicitud no corresponde a cancelación");
        }

        if (solicitud.getCancellationActionType() == null){
            throw new RuntimeException("La cancelación no tiene tipo definido");
        }

        switch (solicitud.getCancellationActionType()){
            case BLOCK -> ejecutarBloqueo(solicitud);
            case DELETE -> ejecutarEliminacion(solicitud);
            case ANONYMIZE -> ejecutarAnonimizacion(solicitud);
        }

        solicitud.setStatus(ArcoStatus.RESPONDIDA);
        solicitud.setResolvedAt(LocalDateTime.now());

        return modelMapper.map(
                arcoRequestRepository.save(solicitud), ArcoRequestResponseDTO.class);
    }

    ///en esta seccion los metodos ejecutan logica que se encuentra en organization
    /// ya que estos tratamientos los hacen ahi


    private void ejecutarBloqueo(ArcoRequest solicitud) {

        solicitud.setResolutionSummary(
                "Se ejecutó la cancelación mediante bloqueo lógico. " +
                        "Los datos del titular quedan restringidos para nuevos tratamientos por parte de la organización."
        );
    }

    private void ejecutarEliminacion(ArcoRequest solicitud) {

        solicitud.setResolutionSummary(
                "Se registró la cancelación mediante eliminación lógica. " +
                        "Los datos no serán eliminados físicamente en esta etapa, pero quedan marcados como no disponibles para tratamiento."
        );
    }

    private void ejecutarAnonimizacion(ArcoRequest solicitud) {

        solicitud.setResolutionSummary(
                "Se ejecutó la cancelación mediante anonimización lógica. " +
                        "Los datos identificables del titular deberán ser reemplazados por valores no atribuibles directamente."
        );
    }
}
