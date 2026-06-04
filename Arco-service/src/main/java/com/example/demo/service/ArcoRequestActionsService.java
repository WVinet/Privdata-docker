package com.example.demo.service;

import com.example.demo.dto.request.arcoRequestAction.ArcoRequestActionCreateDTO;
import com.example.demo.dto.response.ArcoRequestActionResponseDTO;
import com.example.demo.exception.ArcoRequestNotFoundException;
import com.example.demo.model.ArcoRequestActions;
import com.example.demo.repository.ArcoRequestActionsRepository;
import com.example.demo.repository.ArcoRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArcoRequestActionsService {

    private final ArcoRequestActionsRepository actionsRepository;
    private final ArcoRequestRepository arcoRequestRepository;

    public List<ArcoRequestActionResponseDTO> listarPorSolicitud(UUID arcoRequestId) {
        if (!arcoRequestRepository.existsById(arcoRequestId)) {
            throw new ArcoRequestNotFoundException(arcoRequestId);
        }
        return actionsRepository.findByArcoRequest_IdOrderByExecutedAtAsc(arcoRequestId).stream()
                .map(ArcoRequestActionResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ArcoRequestActionResponseDTO registrarAccion(UUID arcoRequestId, ArcoRequestActionCreateDTO dto) {
        var solicitud = arcoRequestRepository.findById(arcoRequestId)
                .orElseThrow(() -> new ArcoRequestNotFoundException(arcoRequestId));

        ArcoRequestActions accion = new ArcoRequestActions();
        accion.setArcoRequest(solicitud);
        accion.setExecutedByUserId(dto.getExecutedByUserId());
        accion.setActionType(dto.getActionType());
        accion.setResultSummary(dto.getResultSummary());
        accion.setArtifactUrl(dto.getArtifactUrl());
        return ArcoRequestActionResponseDTO.fromEntity(actionsRepository.save(accion));
    }
}
