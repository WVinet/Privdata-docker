package cl.privdata.complianceService.controller;

import cl.privdata.complianceService.DTO.request.TreatmentActivityCreateRequestDTO;
import cl.privdata.complianceService.DTO.request.TreatmentActivityUpdateRequestDTO;
import cl.privdata.complianceService.DTO.response.TreatmentActivityResponseDTO;
import cl.privdata.complianceService.model.enums.TreatmentActivityStatus;
import cl.privdata.complianceService.service.TreatmentActivityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/compliance/rat")
public class TreatmentActivityController {

    private final TreatmentActivityService service;

    public TreatmentActivityController(TreatmentActivityService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<TreatmentActivityResponseDTO>> getByOrganization(
            @RequestParam UUID organizationId,
            @RequestParam(required = false) TreatmentActivityStatus status
    ) {
        return ResponseEntity.ok(service.getByOrganization(organizationId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TreatmentActivityResponseDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<TreatmentActivityResponseDTO> create(
            @Valid @RequestBody TreatmentActivityCreateRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TreatmentActivityResponseDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody TreatmentActivityUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(service.update(id, request));
    }
}
