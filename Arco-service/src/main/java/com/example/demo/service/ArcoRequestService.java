package com.example.demo.service;

import com.example.demo.dto.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.dto.arcoRequest.ArcoRequestResponseDTO;
import com.example.demo.dto.arcoRequest.ArcoRequestStatusUpdateDTO;
import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.exception.ArcoRequestNotFoundException;
import com.example.demo.model.ArcoRequest;
import com.example.demo.model.ArcoRequestStatusHistory;
import com.example.demo.repository.ArcoRequestRepository;
import com.example.demo.repository.ArcoRequestStatusHistoryRepository;
import com.example.demo.util.BusinessDaysCalculator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArcoRequestService {

    private final ArcoRequestRepository arcoRequestRepository;
    private final ArcoRequestStatusHistoryRepository statusHistoryRepository;

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
        return ArcoRequestResponseDTO.fromEntity(arcoRequestRepository.save(solicitud));
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
}
