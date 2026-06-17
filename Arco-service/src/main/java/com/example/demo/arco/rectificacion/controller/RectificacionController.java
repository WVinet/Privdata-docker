package com.example.demo.arco.rectificacion.controller;

import com.example.demo.arco.common.dto.VerifyIdentityDTO;
import com.example.demo.arco.rectificacion.service.RectificacionService;
import com.example.demo.arco.rectificacion.dto.RectificationResponseDTO;
import com.example.demo.dto.request.PersonRectificationRequestDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.model.ArcoRequest;
import com.example.demo.shared.ApiResponseDTO;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/arso/rectification")
@RequiredArgsConstructor
public class RectificacionController {

    private final RectificacionService rectificacionService;

    @PostMapping
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> crear(
            @RequestBody CreateRectificationRequestDTO dto) {

        ArcoRequest response = rectificacionService.crear(
                dto.getArcoRequest(),
                dto.getRectificationData()
        );

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Solicitud de rectificación creada correctamente",
                response
        ));
    }

    @PatchMapping("/{requestId}/verify-identity")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> verifyIdentity(
            @PathVariable UUID requestId,
            @RequestBody VerifyIdentityDTO dto) {

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Verificación de identidad actualizada",
                rectificacionService.verifyIdentity(requestId, dto)
        ));
    }

    @PatchMapping("/{requestId}/respond")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> respondRequest(
            @PathVariable UUID requestId,
            @RequestBody RectificationResponseDTO dto) {

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Solicitud de rectificación respondida correctamente",
                rectificacionService.respondRequest(requestId, dto)
        ));
    }

    @Data
    public static class CreateRectificationRequestDTO {
        private ArcoRequestCreateDTO arcoRequest;
        private PersonRectificationRequestDTO rectificationData;
    }
}