package cl.privdata.organizationService.controller;

import cl.privdata.organizationService.dto.request.OrganizationCreateRequestDTO;

import cl.privdata.organizationService.dto.request.OrganizationStatusUpdateRequestDTO;
import cl.privdata.organizationService.dto.request.OrganizationUpdateRequestDTO;
import cl.privdata.organizationService.dto.response.ApiResponseDTO;
import cl.privdata.organizationService.dto.response.OrganizationResponseDTO;
import cl.privdata.organizationService.service.OrganizationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO<OrganizationResponseDTO>> create(
            @Valid @RequestBody OrganizationCreateRequestDTO request
    ) {
        OrganizationResponseDTO response = organizationService.create(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponseDTO<>(
                        true,
                        "Organización creada correctamente",
                        response
                ));
    }

    @GetMapping
    public ResponseEntity<ApiResponseDTO<List<OrganizationResponseDTO>>> findAll() {
        List<OrganizationResponseDTO> response = organizationService.findAll();

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Organizaciones obtenidas correctamente",
                response
        ));
    }

    @GetMapping("/{organizationId}")
    public ResponseEntity<ApiResponseDTO<OrganizationResponseDTO>> findById(
            @PathVariable UUID organizationId
    ) {
        OrganizationResponseDTO response = organizationService.findById(organizationId);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Organización obtenida correctamente",
                response
        ));
    }

    @PutMapping("/{organizationId}")
    public ResponseEntity<ApiResponseDTO<OrganizationResponseDTO>> update(
            @PathVariable UUID organizationId,
            @Valid @RequestBody OrganizationUpdateRequestDTO request
    ) {
        OrganizationResponseDTO response = organizationService.update(organizationId, request);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Organización actualizada correctamente",
                response
        ));
    }

    @PatchMapping("/{organizationId}/status")
    public ResponseEntity<ApiResponseDTO<OrganizationResponseDTO>> updateStatus(
            @PathVariable UUID organizationId,
            @Valid @RequestBody OrganizationStatusUpdateRequestDTO request
    ) {
        OrganizationResponseDTO response = organizationService.updateStatus(organizationId, request);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Estado de la organización actualizado correctamente",
                response
        ));
    }
}