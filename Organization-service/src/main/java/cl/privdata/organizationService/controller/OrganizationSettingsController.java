package cl.privdata.organizationService.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import cl.privdata.organizationService.dto.request.OrganizationSettingsCreateRequestDTO;
import cl.privdata.organizationService.dto.request.OrganizationSettingsUpdateRequestDTO;
import cl.privdata.organizationService.dto.response.ApiResponseDTO;
import cl.privdata.organizationService.dto.response.OrganizationSettingsResponseDTO;
import cl.privdata.organizationService.service.OrganizationSettingsService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/organizations/{organizationId}/settings")
public class OrganizationSettingsController {

    private final OrganizationSettingsService organizationSettingsService;

    public OrganizationSettingsController(OrganizationSettingsService organizationSettingsService) {
        this.organizationSettingsService = organizationSettingsService;
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO<OrganizationSettingsResponseDTO>> create(
            @PathVariable UUID organizationId,
            @Valid @RequestBody OrganizationSettingsCreateRequestDTO request
    ) {
        OrganizationSettingsResponseDTO response =
                organizationSettingsService.create(organizationId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponseDTO<>(
                        true,
                        "Configuración creada correctamente",
                        response
                ));
    }

    @GetMapping
    public ResponseEntity<ApiResponseDTO<OrganizationSettingsResponseDTO>> findByOrganizationId(
            @PathVariable UUID organizationId
    ) {
        OrganizationSettingsResponseDTO response =
                organizationSettingsService.findByOrganizationId(organizationId);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Configuración obtenida correctamente",
                response
        ));
    }

    @PutMapping
    public ResponseEntity<ApiResponseDTO<OrganizationSettingsResponseDTO>> update(
            @PathVariable UUID organizationId,
            @Valid @RequestBody OrganizationSettingsUpdateRequestDTO request
    ) {
        OrganizationSettingsResponseDTO response =
                organizationSettingsService.update(organizationId, request);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Configuración actualizada correctamente",
                response
        ));
    }
}
