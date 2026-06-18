package com.example.demo.arco.portabilidad.controller;

import com.example.demo.arco.common.dto.VerifyIdentityDTO;
import com.example.demo.arco.portabilidad.dto.CreatePortabilityDTO;
import com.example.demo.arco.portabilidad.dto.PortabilityResponseDTO;
import com.example.demo.arco.portabilidad.service.PortabilityService;
import com.example.demo.model.ArcoRequest;
import com.example.demo.shared.ApiResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;

import java.util.UUID;

@RestController
@RequestMapping("/api/arso/portability")
@RequiredArgsConstructor
public class PortabilityController {

    private final PortabilityService portabilityService;

    @PostMapping
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> create(
            @RequestBody CreatePortabilityDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Solicitud creada",
                        portabilityService.create(dto)
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
                        portabilityService.verifyIdentity(id, dto)
                )
        );
    }

    @PatchMapping("/{id}/respond")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> respond(
            @PathVariable UUID id,
            @RequestBody PortabilityResponseDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Solicitud respondida",
                        portabilityService.respond(id, dto)
                )
        );
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(
            @PathVariable UUID id
    ) {

        return portabilityService.download(id);
    }
}