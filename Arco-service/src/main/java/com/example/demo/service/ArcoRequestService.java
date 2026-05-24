package com.example.demo.service;

import com.example.demo.dto.ArcoResponseDTO;
import com.example.demo.dto.CreateArcoRequestDTO;
import com.example.demo.dto.UpdateArcoStatusDTO;
import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.model.ArcoRequest;
import com.example.demo.repository.ArcoRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ArcoRequestService {

    private final ArcoRequestRepository arcoRequestRepository;

    public List<ArcoResponseDTO> findAll(UUID organizationId) {
        List<ArcoRequest> list = organizationId != null
                ? arcoRequestRepository.findByOrganizationId(organizationId)
                : arcoRequestRepository.findAll();
        return list.stream().map(this::toDTO).toList();
    }

    public List<ArcoResponseDTO> findByDataSubject(UUID dataSubjectId) {
        return arcoRequestRepository.findByDataSubjectId(dataSubjectId)
                .stream().map(this::toDTO).toList();
    }

    public ArcoResponseDTO findById(UUID id) {
        ArcoRequest req = arcoRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud ARCO no encontrada"));
        return toDTO(req);
    }

    public ArcoResponseDTO registrarSolicitud(CreateArcoRequestDTO dto) {
        ArcoRequest req = new ArcoRequest();
        req.setOrganizationId(dto.getOrganizationId());
        req.setDataSubjectId(dto.getDataSubjectId());
        req.setAssignedToUserId(dto.getAssignedToUserId());
        req.setRequestType(dto.getRequestType());
        req.setStatus(ArcoStatus.RECIBIDA);
        req.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.ACCESS_ACCEPTED);
        req.setRequestChannel(dto.getRequestChannel());
        LocalDateTime now = LocalDateTime.now();
        req.setSubmittedAt(now);
        req.setDueDate(now.plusDays(30));
        req.setDescription(dto.getDescription());
        req.setResolutionSummary(null);
        req.setResolvedAt(null);
        return toDTO(arcoRequestRepository.save(req));
    }

    public ArcoResponseDTO updateStatus(UUID id, UpdateArcoStatusDTO dto) {
        ArcoRequest req = arcoRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitud ARCO no encontrada"));
        req.setStatus(dto.getStatus());
        if (dto.getResolutionSummary() != null) {
            req.setResolutionSummary(dto.getResolutionSummary());
        }
        if (dto.getStatus() == ArcoStatus.RESPONDIDA || dto.getStatus() == ArcoStatus.RECHAZADA) {
            req.setResolvedAt(LocalDateTime.now());
        }
        return toDTO(arcoRequestRepository.save(req));
    }

    private ArcoResponseDTO toDTO(ArcoRequest r) {
        return new ArcoResponseDTO(
                r.getId(),
                r.getOrganizationId(),
                r.getDataSubjectId(),
                r.getAssignedToUserId(),
                r.getRequestType() != null ? r.getRequestType().name() : null,
                r.getStatus() != null ? r.getStatus().name() : null,
                r.getIdentityVerificationStatus() != null ? r.getIdentityVerificationStatus().name() : null,
                r.getRequestChannel() != null ? r.getRequestChannel().name() : null,
                r.getSubmittedAt(),
                r.getDueDate(),
                r.getDescription(),
                r.getResolutionSummary(),
                r.getResolvedAt(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
