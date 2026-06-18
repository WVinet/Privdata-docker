package com.example.demo.arco.supresion.controller;

import com.example.demo.arco.common.dto.VerifyIdentityDTO;
import com.example.demo.arco.supresion.dto.CreateSuppressionDTO;
import com.example.demo.arco.supresion.dto.SuppressionResponseDTO;
import com.example.demo.arco.supresion.service.SupresionService;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.model.ArcoRequest;
import com.example.demo.shared.ApiResponseDTO;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/arso/suppression")
@RequiredArgsConstructor
public class SuppressionController {

    private final SupresionService supresionService;

    @PostMapping
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> crear(
            @RequestBody CreateSuppressionDTO dto) {

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Solicitud de supresión creada correctamente",
                supresionService.crear(
                        dto.getArcoRequest(),
                        dto.getCause(),
                        dto.getReason(),
                        dto.getOriginalPurpose(),
                        dto.getConsentRevokedAt(),
                        dto.getDataCollectedAt(),
                        dto.getRetentionExpiresAt()
                )
        ));
    }

    @PatchMapping("/{requestId}/verify-identity")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> verifyIdentity(
            @PathVariable UUID requestId,
            @RequestBody VerifyIdentityDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Identidad verificada",
                        supresionService.verifyIdentity(
                                requestId,
                                dto
                        )
                )
        );
    }

    @PatchMapping("/{requestId}/respond")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> respond(
            @PathVariable UUID requestId,
            @RequestBody SuppressionResponseDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Solicitud de supresión respondida",
                        supresionService.respondRequest(
                                requestId,
                                dto
                        )
                )
        );
    }

}