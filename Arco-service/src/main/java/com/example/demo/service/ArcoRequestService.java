package com.example.demo.service;

import com.example.demo.dto.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.dto.arcoRequest.ArcoRequestStatusUpdateDTO;
import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.exception.ArcoRequestNotFoundException;
import com.example.demo.model.ArcoRequest;
import com.example.demo.model.ArcoRequestStatusHistory;
import com.example.demo.repository.ArcoRequestRepository;
import com.example.demo.repository.ArcoRequestStatusHistoryRepository;
import com.example.demo.util.BusinessDaysCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ArcoRequestService {

    private final ArcoRequestRepository arcoRequestRepository;
    private final ArcoRequestStatusHistoryRepository statusHistoryRepository;

    public List<ArcoRequest> listar() {
        return arcoRequestRepository.findAll();
    }

    public ArcoRequest buscarPorId(UUID id) {
        return arcoRequestRepository.findById(id)
                .orElseThrow(() -> new ArcoRequestNotFoundException(id));
    }

    public List<ArcoRequest> listarPorOrganizacion(UUID organizationId) {
        return arcoRequestRepository.findByOrganizationId(organizationId);
    }

    public List<ArcoRequest> listarPorTitular(UUID dataSubjectId) {
        return arcoRequestRepository.findByDataSubjectId(dataSubjectId);
    }

    public List<ArcoRequest> listarPorEstado(ArcoStatus status) {
        return arcoRequestRepository.findByStatus(status);
    }

    @Transactional
    public ArcoRequest crearSolicitud(ArcoRequestCreateDTO dto) {
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
        return arcoRequestRepository.save(solicitud);
    }

    @Transactional
    public ArcoRequest cambiarEstado(UUID id, ArcoRequestStatusUpdateDTO dto) {
        ArcoRequest solicitud = buscarPorId(id);
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

        return solicitud;
    }

    @Transactional
    public ArcoRequest actualizarVerificacionIdentidad(UUID id, ArcoIdentityVerificationStatus nuevoEstado) {
        ArcoRequest solicitud = buscarPorId(id);
        solicitud.setIdentityVerificationStatus(nuevoEstado);
        return arcoRequestRepository.save(solicitud);
    }

    @Transactional
    public ArcoRequest actualizarResolucion(UUID id, String resolutionSummary) {
        ArcoRequest solicitud = buscarPorId(id);
        solicitud.setResolutionSummary(resolutionSummary);
        return arcoRequestRepository.save(solicitud);
    }
}
