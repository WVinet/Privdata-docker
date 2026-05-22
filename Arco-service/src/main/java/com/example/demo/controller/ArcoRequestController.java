package com.example.demo.controller;

import com.example.demo.dto.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.dto.arcoRequest.ArcoRequestStatusUpdateDTO;
import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.model.ArcoRequest;
import com.example.demo.service.ArcoRequestService;
import jakarta.validation.Valid;
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
    public ResponseEntity<List<ArcoRequest>> listar(
            @RequestParam(required = false) UUID organizationId,
            @RequestParam(required = false) UUID dataSubjectId,
            @RequestParam(required = false) ArcoStatus status) {

        if (organizationId != null) {
            return ResponseEntity.ok(arcoRequestService.listarPorOrganizacion(organizationId));
        }
        if (dataSubjectId != null) {
            return ResponseEntity.ok(arcoRequestService.listarPorTitular(dataSubjectId));
        }
        if (status != null) {
            return ResponseEntity.ok(arcoRequestService.listarPorEstado(status));
        }
        return ResponseEntity.ok(arcoRequestService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArcoRequest> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(arcoRequestService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<ArcoRequest> crearSolicitud(@Valid @RequestBody ArcoRequestCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(arcoRequestService.crearSolicitud(dto));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<ArcoRequest> cambiarEstado(
            @PathVariable UUID id,
            @Valid @RequestBody ArcoRequestStatusUpdateDTO dto) {
        return ResponseEntity.ok(arcoRequestService.cambiarEstado(id, dto));
    }

    @PatchMapping("/{id}/verificacion-identidad")
    public ResponseEntity<ArcoRequest> actualizarVerificacionIdentidad(
            @PathVariable UUID id,
            @RequestParam ArcoIdentityVerificationStatus nuevoEstado) {
        return ResponseEntity.ok(arcoRequestService.actualizarVerificacionIdentidad(id, nuevoEstado));
    }

    @PatchMapping("/{id}/resolucion")
    public ResponseEntity<ArcoRequest> actualizarResolucion(
            @PathVariable UUID id,
            @RequestParam String resolutionSummary) {
        return ResponseEntity.ok(arcoRequestService.actualizarResolucion(id, resolutionSummary));
    }
}
