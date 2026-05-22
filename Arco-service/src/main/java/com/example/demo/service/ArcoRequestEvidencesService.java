package com.example.demo.service;

import com.example.demo.dto.arcoRequestEvidence.ArcoRequestEvidenceCreateDTO;
import com.example.demo.dto.arcoRequestEvidence.ArcoRequestEvidenceResponseDTO;
import com.example.demo.exception.ArcoRequestNotFoundException;
import com.example.demo.model.ArcoRequestEvidences;
import com.example.demo.repository.ArcoRequestEvidencesRepository;
import com.example.demo.repository.ArcoRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArcoRequestEvidencesService {

    private final ArcoRequestEvidencesRepository evidencesRepository;
    private final ArcoRequestRepository arcoRequestRepository;

    public List<ArcoRequestEvidenceResponseDTO> listarPorSolicitud(UUID arcoRequestId) {
        verificarSolicitudExiste(arcoRequestId);
        return evidencesRepository.findByArcoRequest_Id(arcoRequestId).stream()
                .map(ArcoRequestEvidenceResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ArcoRequestEvidenceResponseDTO agregarEvidencia(UUID arcoRequestId, ArcoRequestEvidenceCreateDTO dto) {
        var solicitud = arcoRequestRepository.findById(arcoRequestId)
                .orElseThrow(() -> new ArcoRequestNotFoundException(arcoRequestId));

        ArcoRequestEvidences evidencia = new ArcoRequestEvidences();
        evidencia.setArcoRequest(solicitud);
        evidencia.setUploadedByUserId(dto.getUploadedByUserId());
        evidencia.setEvidenceType(dto.getEvidenceType());
        evidencia.setFileName(dto.getFileName());
        evidencia.setFileUrl(dto.getFileUrl());
        evidencia.setFileType(dto.getFileType());
        evidencia.setNotes(dto.getNotes());
        return ArcoRequestEvidenceResponseDTO.fromEntity(evidencesRepository.save(evidencia));
    }

    @Transactional
    public void eliminarEvidencia(UUID evidenceId) {
        if (!evidencesRepository.existsById(evidenceId)) {
            throw new IllegalArgumentException("Evidencia no encontrada con id: " + evidenceId);
        }
        evidencesRepository.deleteById(evidenceId);
    }

    private void verificarSolicitudExiste(UUID arcoRequestId) {
        if (!arcoRequestRepository.existsById(arcoRequestId)) {
            throw new ArcoRequestNotFoundException(arcoRequestId);
        }
    }
}
