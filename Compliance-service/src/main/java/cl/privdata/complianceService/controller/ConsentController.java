package cl.privdata.complianceService.controller;

import java.util.List;
import java.util.UUID;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import cl.privdata.complianceService.DTO.request.ConsentActionRequestDTO;
import cl.privdata.complianceService.DTO.request.ConsentCategoriesUpdateRequestDTO;
import cl.privdata.complianceService.DTO.request.ConsentCreateRequestDTO;
import cl.privdata.complianceService.DTO.response.ConsentEventResponseDTO;
import cl.privdata.complianceService.DTO.response.ConsentResponseDTO;
import cl.privdata.complianceService.model.enums.ConsentStatus;
import cl.privdata.complianceService.service.ConsentService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/compliance/consents")
public class ConsentController {

    private final ConsentService consentService;

    public ConsentController(ConsentService consentService) {
        this.consentService = consentService;
    }

    @GetMapping
    public ResponseEntity<Page<ConsentResponseDTO>> getAll(
            @RequestParam(required = false) UUID dataSubjectId,
            @RequestParam(required = false) ConsentStatus status,
            Pageable pageable
    ) {
        return ResponseEntity.ok(consentService.getAll(dataSubjectId, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConsentResponseDTO> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(consentService.getById(id));
    }

    @GetMapping("/data-subject/{dataSubjectId}")
    public ResponseEntity<List<ConsentResponseDTO>> getByDataSubjectId(@PathVariable UUID dataSubjectId) {
        return ResponseEntity.ok(consentService.getByDataSubjectId(dataSubjectId));
    }

    @PostMapping
    public ResponseEntity<ConsentResponseDTO> create(@Valid @RequestBody ConsentCreateRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(consentService.create(request));
    }

    @PutMapping("/{id}/data-categories")
    public ResponseEntity<ConsentResponseDTO> updateCategories(
            @PathVariable UUID id,
            @Valid @RequestBody ConsentCategoriesUpdateRequestDTO request
    ) {
        return ResponseEntity.ok(consentService.updateCategories(id, request));
    }

    @PostMapping("/{id}/revoke")
    public ResponseEntity<ConsentResponseDTO> revoke(
            @PathVariable UUID id,
            @RequestBody ConsentActionRequestDTO request
    ) {
        return ResponseEntity.ok(consentService.revoke(id, request));
    }

    @PostMapping("/{id}/grant")
    public ResponseEntity<ConsentResponseDTO> grant(
            @PathVariable UUID id,
            @RequestBody ConsentActionRequestDTO request
    ) {
        return ResponseEntity.ok(consentService.grant(id, request));
    }

    @GetMapping("/{id}/events")
    public ResponseEntity<List<ConsentEventResponseDTO>> getEvents(@PathVariable UUID id) {
        return ResponseEntity.ok(consentService.getEvents(id));
    }
}