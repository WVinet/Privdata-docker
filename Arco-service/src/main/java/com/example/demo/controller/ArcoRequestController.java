package com.example.demo.controller;

import com.example.demo.dto.request.ArcoCancellationRequestDTO;
import com.example.demo.dto.request.UpdateArcoStatusDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.dto.response.ArcoRequestResponseDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestStatusUpdateDTO;
import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.service.ArcoRequestService;
import com.example.demo.shared.ApiResponseDTO;
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
    public ResponseEntity<List<ArcoRequestResponseDTO>> listar(
            @RequestParam(required = false) UUID organizationId,
            @RequestParam(required = false) UUID dataSubjectId,
            @RequestParam(required = false) ArcoStatus status) {

        if (organizationId != null) {
            return ResponseEntity.ok(arcoRequestService.listarPorOrganizacion(organizationId));
        }
//        if (dataSubjectId != null) {
//            return ResponseEntity.ok(arcoRequestService.listarPorTitular(dataSubjectId));
//        }
        if (status != null) {
            return ResponseEntity.ok(arcoRequestService.listarPorEstado(status));
        }
        return ResponseEntity.ok(arcoRequestService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArcoRequestResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(arcoRequestService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<ArcoRequestResponseDTO> crearSolicitud(@Valid @RequestBody ArcoRequestCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(arcoRequestService.crearSolicitud(dto));
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<ArcoRequestResponseDTO> cambiarEstado(
            @PathVariable UUID id,
            @Valid @RequestBody ArcoRequestStatusUpdateDTO dto) {
        return ResponseEntity.ok(arcoRequestService.cambiarEstado(id, dto));
    }

    @PatchMapping("/{id}/verificacion-identidad")
    public ResponseEntity<ArcoRequestResponseDTO> actualizarVerificacionIdentidad(
            @PathVariable UUID id,
            @RequestParam ArcoIdentityVerificationStatus nuevoEstado) {
        return ResponseEntity.ok(arcoRequestService.actualizarVerificacionIdentidad(id, nuevoEstado));
    }

    @PatchMapping("/{id}/resolucion")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> actualizarResolucion(
            @PathVariable UUID id,
            @RequestBody ArcoRequestStatusUpdateDTO dto) {
        return ResponseEntity.ok(new ApiResponseDTO<>(
                true, "Estado actualizado correctamente",
                arcoRequestService.cambiarEstado(id, dto)));
    }

    ///endpoints derecho cancelación
    /// Creacion de solicitud cancelacion
    @PostMapping("/cancellation")
    public ResponseEntity<ArcoRequestResponseDTO> crearSolicitudCancelacion(
            @RequestBody ArcoCancellationRequestDTO requestDTO
    ) {
        return ResponseEntity.ok(
                arcoRequestService.crearSolicitudCancelacion(requestDTO)
        );
    }

    ///se ejectua el derecho dependiendo del la opcion
    @PostMapping("/cancellation/{solicitudId}/execute")
    public ResponseEntity<ArcoRequestResponseDTO> ejecutarCancelacion(
            @PathVariable UUID solicitudId
    ) {
        return ResponseEntity.ok(
                arcoRequestService.ejecutarCancelacion(solicitudId)
        );
    }
}
