package com.example.demo.arsop.acceso.controller;

import com.example.demo.arsop.acceso.AccesoService;
import com.example.demo.arsop.acceso.dto.AccessResponseDTO;
import com.example.demo.arsop.common.dto.VerifyIdentityDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.model.ArcoRequest;
import com.example.demo.shared.ApiResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/arso/access")
@RequiredArgsConstructor
public class AccessController {

    private final AccesoService accesoService;

    @PatchMapping("/{requestId}/verify-identity")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> verifyIdentity(
            @PathVariable UUID requestId,
            @RequestBody VerifyIdentityDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Verificación de identidad actualizada",
                        accesoService.verifyIdentity(requestId, dto.getVerified(), dto.getComment())
                )
        );
    }

    @PatchMapping("/{requestId}/respond")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> respondRequest(
            @PathVariable UUID requestId,
            @RequestBody AccessResponseDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Solicitud respondida correctamente",
                        accesoService.respondRequest(requestId, dto)
                )
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> create(
            @RequestBody ArcoRequestCreateDTO dto) {

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Solicitud de acceso creada correctamente",
                accesoService.crear(dto)
        ));
    }
}

