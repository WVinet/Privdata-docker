package com.example.demo.controller;

import com.example.demo.dto.request.ArcoCancellationRequestDTO;
import com.example.demo.dto.request.ArcoRectificationRequestDTO;
import com.example.demo.dto.request.UpdateArcoStatusDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestStatusUpdateDTO;
import com.example.demo.dto.response.ArcoRequestResponseDTO;
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
    public ResponseEntity<ApiResponseDTO<List<ArcoRequestResponseDTO>>> listar(
            @RequestParam(required = false) UUID organizationId,
            @RequestParam(required = false) UUID dataSubjectId,
            @RequestParam(required = false) ArcoStatus status) {

        List<ArcoRequestResponseDTO> resultado;
        if (organizationId != null) {
            resultado = arcoRequestService.listarPorOrganizacion(organizationId);
        } else if (dataSubjectId != null) {
            resultado = arcoRequestService.listarPorTitular(dataSubjectId);
        } else if (status != null) {
            resultado = arcoRequestService.listarPorEstado(status);
        } else {
            resultado = arcoRequestService.listar();
        }
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Solicitudes obtenidas", resultado));
    }

    @GetMapping("/by-subject/{dataSubjectId}")
    public ResponseEntity<ApiResponseDTO<List<ArcoRequestResponseDTO>>> buscarPorTitular(@PathVariable UUID dataSubjectId) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Solicitudes obtenidas",
                arcoRequestService.listarPorTitular(dataSubjectId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Solicitud obtenida", arcoRequestService.buscarPorId(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> crearSolicitud(@Valid @RequestBody ArcoRequestCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponseDTO<>(true, "Solicitud creada correctamente", arcoRequestService.crearSolicitud(dto)));
    }

    ///Despues de verificar la identidad del titutar usamos cambiar estado a EN_GESTION
    @PatchMapping("/{id}/estado")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> cambiarEstado(
            @PathVariable UUID id,
            @Valid @RequestBody ArcoRequestStatusUpdateDTO dto) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Estado actualizado", arcoRequestService.cambiarEstado(id, dto)));
    }

    @PatchMapping("/{id}/prorroga")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> prorrogarPlazo(@PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Prórroga otorgada",
                arcoRequestService.prorrogarPlazo(id)));
    }

    ///Admin verifica identidad con respecto a cualquier tipo de solicitud
    @PatchMapping("/{id}/verificacion-identidad")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> actualizarVerificacionIdentidad(
            @PathVariable UUID id,
            @RequestParam ArcoIdentityVerificationStatus nuevoEstado) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Identidad actualizada",
                arcoRequestService.actualizarVerificacionIdentidad(id, nuevoEstado)));
    }

    @PatchMapping("/{id}/resolucion")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> actualizarResolucion(
            @PathVariable UUID id,
            @RequestBody UpdateArcoStatusDTO dto) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Resolución registrada",
                arcoRequestService.actualizarResolucion(id, dto.getResolutionSummary())));
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

    ///endpoints relacionados a solicitud rectificacion
    @PostMapping("/rectification")
    public ResponseEntity<ArcoRequestResponseDTO> crearSolicitudRectificacion(
            @RequestBody ArcoRectificationRequestDTO requestDTO
    ) {
        return ResponseEntity.ok(
                arcoRequestService.crearSolicitudRectificacion(requestDTO)
        );
    }

    @PostMapping("/rectification/{solicitudId}/execute")
    public ResponseEntity<?> ejecutarRectificacion(
            @PathVariable UUID solicitudId
    ) {

        return ResponseEntity.ok(
                arcoRequestService.ejecutarRectificacion(solicitudId)
        );
    }
}
