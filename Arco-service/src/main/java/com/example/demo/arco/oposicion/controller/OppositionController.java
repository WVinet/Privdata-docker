package com.example.demo.arco.oposicion.controller;

import com.example.demo.arco.common.dto.VerifyIdentityDTO;
import com.example.demo.arco.oposicion.dto.CreateOppositionDTO;
import com.example.demo.arco.oposicion.dto.OppositionResponseDTO;
import com.example.demo.arco.oposicion.service.OppositionService;
import com.example.demo.model.ArcoRequest;
import com.example.demo.shared.ApiResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/arso/opposition")
@RequiredArgsConstructor
public class OppositionController {

    private final OppositionService oposicionService;

    @PostMapping
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> crear(
            @RequestBody CreateOppositionDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Solicitud de oposición creada correctamente",
                        oposicionService.crear(
                                dto.getArcoRequest(),
                                dto.getCause(),
                                dto.getReason(),
                                dto.getProcessingPurpose(),
                                dto.getOpposedTreatment(),
                                dto.getTreatmentActivityId()
                        )
                )
        );
    }

    @PatchMapping("/{requestId}/verify-identity")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> verifyIdentity(
            @PathVariable UUID requestId,
            @RequestBody VerifyIdentityDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Identidad verificada",
                        oposicionService.verifyIdentity(
                                requestId,
                                dto
                        )
                )
        );
    }

    @PatchMapping("/{requestId}/respond")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> respond(
            @PathVariable UUID requestId,
            @RequestBody OppositionResponseDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Solicitud de oposición respondida",
                        oposicionService.respondRequest(
                                requestId,
                                dto
                        )
                )
        );
    }
}