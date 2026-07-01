package cl.privdata.complianceService.controller;

import cl.privdata.complianceService.DTO.request.TerceroCreateRequestDTO;
import cl.privdata.complianceService.DTO.request.TerceroUpdateRequestDTO;
import cl.privdata.complianceService.DTO.response.TerceroResponseDTO;
import cl.privdata.complianceService.service.TerceroService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/compliance/terceros")
public class TerceroController {

    private final TerceroService service;

    public TerceroController(TerceroService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<TerceroResponseDTO>> getByOrganization(
            @RequestParam UUID organizationId,
            @RequestParam(required = false) Boolean onlyActive
    ) {
        return ResponseEntity.ok(service.getByOrganization(organizationId, onlyActive));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TerceroResponseDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<TerceroResponseDTO> create(
            @Valid @RequestBody TerceroCreateRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TerceroResponseDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody TerceroUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
