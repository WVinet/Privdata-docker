package cl.duoc.agenciaService.controller;

import cl.duoc.agenciaService.dto.request.AgencyClaimCreateRequest;
import cl.duoc.agenciaService.dto.request.AgencyClaimRespondRequest;
import cl.duoc.agenciaService.dto.response.AgencyClaimResponseDTO;
import cl.duoc.agenciaService.enums.AgencyClaimStatus;
import cl.duoc.agenciaService.service.AgencyClaimService;
import cl.duoc.agenciaService.shared.ApiResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/agency-claims")
@RequiredArgsConstructor
public class AgencyClaimController {

    private final AgencyClaimService agencyClaimService;

    // Llamado por Arco-service (server-to-server) cuando el titular escala su disconformidad
    @PostMapping
    public ResponseEntity<ApiResponseDTO<AgencyClaimResponseDTO>> crear(@RequestBody AgencyClaimCreateRequest dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponseDTO<>(true, "Reclamo registrado", agencyClaimService.crear(dto)));
    }

    @GetMapping
    public ResponseEntity<ApiResponseDTO<Page<AgencyClaimResponseDTO>>> listar(
            @RequestParam(required = false) AgencyClaimStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Reclamos obtenidos",
                agencyClaimService.listar(status, PageRequest.of(page, size))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDTO<AgencyClaimResponseDTO>> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Reclamo obtenido", agencyClaimService.buscarPorId(id)));
    }

    // Panel de solo lectura: todas las solicitudes ARCO de PrivData (transparencia)
    @GetMapping("/arco-overview")
    public ResponseEntity<ApiResponseDTO<Object>> panelSolicitudes(@RequestParam(required = false) UUID organizationId) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Solicitudes ARCO obtenidas",
                agencyClaimService.panelSolicitudes(organizationId)));
    }

    @PatchMapping("/{id}/respond")
    public ResponseEntity<ApiResponseDTO<AgencyClaimResponseDTO>> responder(
            @PathVariable UUID id,
            @Valid @RequestBody AgencyClaimRespondRequest dto) {
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Respuesta registrada",
                agencyClaimService.responder(id, dto.getResponse())));
    }
}
