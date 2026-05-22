package com.example.demo.controller;

import com.example.demo.dto.arcoRequestEvidence.ArcoRequestEvidenceCreateDTO;
import com.example.demo.model.ArcoRequestEvidences;
import com.example.demo.service.ArcoRequestEvidencesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/arco-request/{arcoRequestId}/evidencias")
@RequiredArgsConstructor
public class ArcoRequestEvidencesController {

    private final ArcoRequestEvidencesService evidencesService;

    @GetMapping
    public ResponseEntity<List<ArcoRequestEvidences>> listar(@PathVariable UUID arcoRequestId) {
        return ResponseEntity.ok(evidencesService.listarPorSolicitud(arcoRequestId));
    }

    @PostMapping
    public ResponseEntity<ArcoRequestEvidences> agregar(
            @PathVariable UUID arcoRequestId,
            @Valid @RequestBody ArcoRequestEvidenceCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(evidencesService.agregarEvidencia(arcoRequestId, dto));
    }

    @DeleteMapping("/{evidenceId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable UUID arcoRequestId,
            @PathVariable UUID evidenceId) {
        evidencesService.eliminarEvidencia(evidenceId);
        return ResponseEntity.noContent().build();
    }
}
