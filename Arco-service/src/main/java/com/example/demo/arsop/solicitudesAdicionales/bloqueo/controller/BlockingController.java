package com.example.demo.arsop.solicitudesAdicionales.bloqueo.controller;


import com.example.demo.arsop.common.dto.VerifyIdentityDTO;
import com.example.demo.arsop.solicitudesAdicionales.bloqueo.dto.BlockingResponseDTO;
import com.example.demo.arsop.solicitudesAdicionales.bloqueo.dto.CreateBlockingDTO;
import com.example.demo.arsop.solicitudesAdicionales.bloqueo.service.BlockingService;
import com.example.demo.model.ArcoRequest;
import com.example.demo.shared.ApiResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/arso/blocking")
@RequiredArgsConstructor
public class BlockingController {

    private final BlockingService blockingService;

    @PostMapping
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> create(
            @RequestBody CreateBlockingDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Solicitud creada",
                        blockingService.create(dto)
                )
        );
    }

    @PatchMapping("/{id}/verify-identity")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> verify(
            @PathVariable UUID id,
            @RequestBody VerifyIdentityDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Identidad verificada",
                        blockingService.verifyIdentity(id, dto)
                )
        );
    }

    @PatchMapping("/{id}/respond")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> respond(
            @PathVariable UUID id,
            @RequestBody BlockingResponseDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Solicitud respondida",
                        blockingService.respond(id, dto)
                )
        );
    }
}