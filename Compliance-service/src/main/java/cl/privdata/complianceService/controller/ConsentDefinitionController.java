package cl.privdata.complianceService.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import cl.privdata.complianceService.DTO.request.ConsentDefinitionCreateRequestDTO;
import cl.privdata.complianceService.DTO.response.ConsentDefinitionResponseDTO;
import cl.privdata.complianceService.service.ConsentDefinitionService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/compliance/consent-definitions")
public class ConsentDefinitionController {

    private final ConsentDefinitionService service;

    public ConsentDefinitionController(ConsentDefinitionService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ConsentDefinitionResponseDTO>> getByOrganization(
            @RequestParam UUID organizationId
    ) {
        return ResponseEntity.ok(service.getByOrganization(organizationId));
    }

    @PostMapping
    public ResponseEntity<ConsentDefinitionResponseDTO> create(
            @Valid @RequestBody ConsentDefinitionCreateRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<ConsentDefinitionResponseDTO> setActive(
            @PathVariable UUID id,
            @RequestParam boolean value
    ) {
        return ResponseEntity.ok(service.setActive(id, value));
    }
}
