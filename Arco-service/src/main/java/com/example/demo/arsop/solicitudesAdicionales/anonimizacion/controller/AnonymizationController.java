package com.example.demo.arsop.solicitudesAdicionales.anonimizacion.controller;


import com.example.demo.arsop.common.dto.VerifyIdentityDTO;
import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.dto.AnonymizationResponseDTO;
import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.dto.CreateAnonymizationDTO;
import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.service.AnonymizationService;
import com.example.demo.model.ArcoRequest;
import com.example.demo.shared.ApiResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/arso/anonymization")
@RequiredArgsConstructor
public class AnonymizationController {

    private final AnonymizationService anonymizationService;

    @PostMapping
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> create(
            @RequestBody CreateAnonymizationDTO dto
    ) {
        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Solicitud de anonimización creada correctamente",
                        anonymizationService.create(dto)
                )
        );
    }

    @PatchMapping("/{id}/verify-identity")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> verifyIdentity(
            @PathVariable UUID id,
            @RequestBody VerifyIdentityDTO dto
    ) {
        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Identidad verificada",
                        anonymizationService.verifyIdentity(id, dto)
                )
        );
    }

    @PatchMapping("/{id}/respond")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> respond(
            @PathVariable UUID id,
            @RequestBody AnonymizationResponseDTO dto
    ) {
        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Solicitud de anonimización respondida",
                        anonymizationService.respond(id, dto)
                )
        );
    }
}