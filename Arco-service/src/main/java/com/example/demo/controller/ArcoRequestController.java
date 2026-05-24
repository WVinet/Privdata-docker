package com.example.demo.controller;

import com.example.demo.dto.ApiResponseDTO;
import com.example.demo.dto.ArcoResponseDTO;
import com.example.demo.dto.CreateArcoRequestDTO;
import com.example.demo.dto.UpdateArcoStatusDTO;
import com.example.demo.service.ArcoRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/arco-request")
@RequiredArgsConstructor
public class ArcoRequestController {

    private final ArcoRequestService arcoRequestService;

    @GetMapping
    public ResponseEntity<ApiResponseDTO<List<ArcoResponseDTO>>> findAll(
            @RequestParam(required = false) UUID organizationId) {
        return ResponseEntity.ok(new ApiResponseDTO<>(
                true, "Solicitudes obtenidas correctamente",
                arcoRequestService.findAll(organizationId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO<ArcoResponseDTO>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponseDTO<>(
                true, "Solicitud obtenida correctamente",
                arcoRequestService.findById(id)));
    }

    @GetMapping("/by-subject/{dataSubjectId}")
    public ResponseEntity<ApiResponseDTO<List<ArcoResponseDTO>>> findByDataSubject(
            @PathVariable UUID dataSubjectId) {
        return ResponseEntity.ok(new ApiResponseDTO<>(
                true, "Solicitudes del titular obtenidas correctamente",
                arcoRequestService.findByDataSubject(dataSubjectId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO<ArcoResponseDTO>> registrar(
            @RequestBody CreateArcoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponseDTO<>(
                true, "Solicitud ARCO registrada correctamente",
                arcoRequestService.registrarSolicitud(dto)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponseDTO<ArcoResponseDTO>> updateStatus(
            @PathVariable UUID id,
            @RequestBody UpdateArcoStatusDTO dto) {
        return ResponseEntity.ok(new ApiResponseDTO<>(
                true, "Estado actualizado correctamente",
                arcoRequestService.updateStatus(id, dto)));
    }
}
