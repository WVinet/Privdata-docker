package com.privdata.bff_api.controller;

import com.privdata.bff_api.service.ComplianceBffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/compliance")
@RequiredArgsConstructor
public class ComplianceBffController {

    private final ComplianceBffService service;

    @GetMapping("/consents")
    public ResponseEntity<?> listConsents(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ResponseEntity.ok(service.listConsents(status, page, size));
    }

    @GetMapping("/consents/data-subject/{dataSubjectId}")
    public ResponseEntity<?> getConsentsByDataSubject(@PathVariable String dataSubjectId) {
        return ResponseEntity.ok(service.getConsentsByDataSubject(dataSubjectId));
    }

    @GetMapping("/rat")
    public ResponseEntity<?> getRat(
            @RequestParam(required = false) String organizationId,
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(service.getRat(organizationId, status));
    }

    @PostMapping("/rat")
    public ResponseEntity<?> createRat(
            @RequestBody Object body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.createRat(body, authorization));
    }

    @PutMapping("/rat/{id}")
    public ResponseEntity<?> updateRat(
            @PathVariable String id,
            @RequestBody Object body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.updateRat(id, body, authorization));
    }

    @PostMapping("/consents/{consentId}/revoke")
    public ResponseEntity<?> revokeConsent(
            @PathVariable String consentId,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.revokeConsent(consentId, authorization));
    }

    @GetMapping("/data-categories")
    public ResponseEntity<?> getDataCategories() {
        return ResponseEntity.ok(service.getDataCategories());
    }

    @PostMapping("/consents")
    public ResponseEntity<?> createConsent(
            @RequestBody Object body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.createConsent(body, authorization));
    }

    @PostMapping("/consents/{consentId}/grant")
    public ResponseEntity<?> grantConsent(@PathVariable String consentId) {
        return ResponseEntity.ok(service.grantConsent(consentId));
    }

    @GetMapping("/consents/pending")
    public ResponseEntity<?> getPendingConsents(
            @RequestParam String organizationId,
            @RequestParam String personId
    ) {
        return ResponseEntity.ok(service.getPendingConsents(organizationId, personId));
    }

    @GetMapping("/consent-definitions")
    public ResponseEntity<?> getConsentDefinitions(@RequestParam String organizationId) {
        return ResponseEntity.ok(service.getConsentDefinitions(organizationId));
    }

    @PostMapping("/consent-definitions")
    public ResponseEntity<?> createConsentDefinition(
            @RequestBody Object body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.createConsentDefinition(body, authorization));
    }

    @GetMapping("/terceros")
    public ResponseEntity<?> getTerceros(
            @RequestParam String organizationId,
            @RequestParam(required = false) Boolean onlyActive) {
        return ResponseEntity.ok(service.getTerceros(organizationId, onlyActive));
    }

    @GetMapping("/terceros/{id}")
    public ResponseEntity<?> getTerceroById(@PathVariable String id) {
        return ResponseEntity.ok(service.getTerceroById(id));
    }

    @PostMapping("/terceros")
    public ResponseEntity<?> createTercero(
            @RequestBody Object body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.createTercero(body, authorization));
    }

    @PutMapping("/terceros/{id}")
    public ResponseEntity<?> updateTercero(
            @PathVariable String id,
            @RequestBody Object body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.updateTercero(id, body, authorization));
    }

    @DeleteMapping("/terceros/{id}")
    public ResponseEntity<?> deleteTercero(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.deleteTercero(id, authorization));
    }

    @PatchMapping("/consent-definitions/{id}/active")
    public ResponseEntity<?> setConsentDefinitionActive(
            @PathVariable String id,
            @RequestParam boolean value,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.setConsentDefinitionActive(id, value, authorization));
    }
}
