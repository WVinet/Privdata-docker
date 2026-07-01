package com.example.demo.controller;

import com.example.demo.dto.request.ArcoAgencyResponseDTO;
import com.example.demo.dto.request.ArcoCancellationRequestDTO;
import com.example.demo.dto.request.UpdateArcoStatusDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestStatusUpdateDTO;
import com.example.demo.dto.response.ArcoRequestResponseDTO;
import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.arsop.common.service.ArcoRequestService;
import com.example.demo.shared.ApiResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.Map;

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

    @PatchMapping("/{id}/estado")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> cambiarEstado(
            @PathVariable UUID id,
            @Valid @RequestBody ArcoRequestStatusUpdateDTO dto) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Estado actualizado", arcoRequestService.cambiarEstado(id, dto)));
    }

    @PatchMapping("/{id}/iniciar-revision")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> iniciarRevision(@PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Solicitud en revisión",
                arcoRequestService.iniciarRevision(id)));
    }

    @PatchMapping("/{id}/prorroga")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> prorrogarPlazo(@PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Prórroga otorgada",
                arcoRequestService.prorrogarPlazo(id)));
    }

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

    // RF-ARCO-CIE-03: el titular registra disconformidad con la resolución
    @PostMapping("/{id}/disconformidad")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> registrarDisconformidad(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String motivo = body != null ? body.get("motivo") : null;
        return ResponseEntity.ok(new ApiResponseDTO<>(true,
                "Disconformidad registrada. Tienes plazo para reclamar ante la Agencia (cpd.cl).",
                arcoRequestService.registrarDisconformidadTitular(id, motivo)));
    }

    // El titular escala su disconformidad como reclamo formal ante la Agencia
    @PostMapping("/{id}/reclamo-agencia")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> reclamarAnteAgencia(@PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true,
                "Reclamo registrado ante la Agencia.",
                arcoRequestService.reclamarAnteAgencia(id)));
    }

    // Callback server-to-server desde Agencia-service al responder un reclamo
    @PatchMapping("/{id}/respuesta-agencia")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> registrarRespuestaAgencia(
            @PathVariable UUID id,
            @RequestBody ArcoAgencyResponseDTO dto) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true,
                "Respuesta de la Agencia registrada.",
                arcoRequestService.registrarRespuestaAgencia(id, dto.getResponse(), dto.getRespondedAt())));
    }

    @PatchMapping("/{id}/block")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> aplicarBloqueoProvisional(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String adminEmail = body != null ? body.get("adminEmail") : null;
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Bloqueo provisional aplicado",
                arcoRequestService.applyProvisionalBlock(id, adminEmail)));
    }

    @PatchMapping("/{id}/unblock")
    public ResponseEntity<ApiResponseDTO<ArcoRequestResponseDTO>> levantarBloqueoProvisional(
            @PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Bloqueo provisional levantado",
                arcoRequestService.liftProvisionalBlock(id)));
    }

    @PostMapping("/cancellation")
    public ResponseEntity<ArcoRequestResponseDTO> crearSolicitudCancelacion(
            @RequestBody ArcoCancellationRequestDTO requestDTO) {
        return ResponseEntity.ok(arcoRequestService.crearSolicitudCancelacion(requestDTO));
    }

    @PostMapping("/cancellation/{solicitudId}/execute")
    public ResponseEntity<ArcoRequestResponseDTO> ejecutarCancelacion(@PathVariable UUID solicitudId) {
        return ResponseEntity.ok(arcoRequestService.ejecutarCancelacion(solicitudId));
    }
}