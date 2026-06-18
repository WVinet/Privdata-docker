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

import cl.privdata.organizationService.dto.request.JobPositionCreateRequestDTO;
import cl.privdata.organizationService.dto.request.JobPositionStatusUpdateRequestDTO;
import cl.privdata.organizationService.dto.request.JobPositionUpdateRequestDTO;
import cl.privdata.organizationService.dto.response.ApiResponseDTO;
import cl.privdata.organizationService.dto.response.JobPositionResponseDTO;
import cl.privdata.organizationService.service.JobPositionService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/organizations/{organizationId}/job-positions")
public class JobPositionController {

    private final JobPositionService jobPositionService;

    public JobPositionController(JobPositionService jobPositionService) {
        this.jobPositionService = jobPositionService;
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO<JobPositionResponseDTO>> create(
            @PathVariable UUID organizationId,
            @Valid @RequestBody JobPositionCreateRequestDTO request
    ) {
        JobPositionResponseDTO response = jobPositionService.create(organizationId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponseDTO<>(
                        true,
                        "Cargo creado correctamente",
                        response
                ));
    }

    @GetMapping
    public ResponseEntity<ApiResponseDTO<List<JobPositionResponseDTO>>> findAll(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) Boolean active
    ) {
        List<JobPositionResponseDTO> response =
                jobPositionService.findAllByOrganization(organizationId, active);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Cargos obtenidos correctamente",
                response
        ));
    }

    @GetMapping("/{jobPositionId}")
    public ResponseEntity<ApiResponseDTO<JobPositionResponseDTO>> findById(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobPositionId
    ) {
        JobPositionResponseDTO response =
                jobPositionService.findById(organizationId, jobPositionId);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Cargo obtenido correctamente",
                response
        ));
    }

    @PutMapping("/{jobPositionId}")
    public ResponseEntity<ApiResponseDTO<JobPositionResponseDTO>> update(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobPositionId,
            @Valid @RequestBody JobPositionUpdateRequestDTO request
    ) {
        JobPositionResponseDTO response =
                jobPositionService.update(organizationId, jobPositionId, request);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Cargo actualizado correctamente",
                response
        ));
    }

    @PatchMapping("/{jobPositionId}/status")
    public ResponseEntity<ApiResponseDTO<JobPositionResponseDTO>> updateStatus(
            @PathVariable UUID organizationId,
            @PathVariable UUID jobPositionId,
            @Valid @RequestBody JobPositionStatusUpdateRequestDTO request
    ) {
        JobPositionResponseDTO response =
                jobPositionService.updateStatus(organizationId, jobPositionId, request);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Estado del cargo actualizado correctamente",
                response
        ));
    }
}
