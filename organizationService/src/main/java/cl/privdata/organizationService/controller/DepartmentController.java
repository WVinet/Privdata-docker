package cl.privdata.organizationService.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import cl.privdata.organizationService.dto.request.DepartmentCreateRequestDTO;
import cl.privdata.organizationService.dto.request.DepartmentStatusUpdateRequestDTO;
import cl.privdata.organizationService.dto.request.DepartmentUpdateRequestDTO;
import cl.privdata.organizationService.dto.response.ApiResponseDTO;
import cl.privdata.organizationService.dto.response.DepartmentResponseDTO;
import cl.privdata.organizationService.service.DepartmentService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/organizations/{organizationId}/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO<DepartmentResponseDTO>> create(
            @PathVariable UUID organizationId,
            @Valid @RequestBody DepartmentCreateRequestDTO request
    ) {
        DepartmentResponseDTO response = departmentService.create(organizationId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponseDTO<>(
                        true,
                        "Departamento creado correctamente",
                        response
                ));
    }

    @GetMapping
    public ResponseEntity<ApiResponseDTO<List<DepartmentResponseDTO>>> findAll(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) Boolean active
    ) {
        List<DepartmentResponseDTO> response =
                departmentService.findAllByOrganization(organizationId, active);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Departamentos obtenidos correctamente",
                response
        ));
    }

    @GetMapping("/{departmentId}")
    public ResponseEntity<ApiResponseDTO<DepartmentResponseDTO>> findById(
            @PathVariable UUID organizationId,
            @PathVariable UUID departmentId
    ) {
        DepartmentResponseDTO response =
                departmentService.findById(organizationId, departmentId);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Departamento obtenido correctamente",
                response
        ));
    }

    @PutMapping("/{departmentId}")
    public ResponseEntity<ApiResponseDTO<DepartmentResponseDTO>> update(
            @PathVariable UUID organizationId,
            @PathVariable UUID departmentId,
            @Valid @RequestBody DepartmentUpdateRequestDTO request
    ) {
        DepartmentResponseDTO response =
                departmentService.update(organizationId, departmentId, request);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Departamento actualizado correctamente",
                response
        ));
    }

    @PatchMapping("/{departmentId}/status")
    public ResponseEntity<ApiResponseDTO<DepartmentResponseDTO>> updateStatus(
            @PathVariable UUID organizationId,
            @PathVariable UUID departmentId,
            @Valid @RequestBody DepartmentStatusUpdateRequestDTO request
    ) {
        DepartmentResponseDTO response =
                departmentService.updateStatus(organizationId, departmentId, request);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Estado del departamento actualizado correctamente",
                response
        ));
    }
}