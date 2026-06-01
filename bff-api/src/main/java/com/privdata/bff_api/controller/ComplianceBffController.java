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
    public ResponseEntity<?> getRat(@RequestParam(required = false) String organizationId) {
        return ResponseEntity.ok(service.getRat(organizationId));
    }

    @PostMapping("/consents/{consentId}/revoke")
    public ResponseEntity<?> revokeConsent(@PathVariable String consentId) {
        return ResponseEntity.ok(service.revokeConsent(consentId));
    }

    @GetMapping("/data-categories")
    public ResponseEntity<?> getDataCategories() {
        return ResponseEntity.ok(service.getDataCategories());
    }

    @PostMapping("/consents")
    public ResponseEntity<?> createConsent(@RequestBody Object body) {
        return ResponseEntity.ok(service.createConsent(body));
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
    public ResponseEntity<?> createConsentDefinition(@RequestBody Object body) {
        return ResponseEntity.ok(service.createConsentDefinition(body));
    }

    @PatchMapping("/consent-definitions/{id}/active")
    public ResponseEntity<?> setConsentDefinitionActive(
            @PathVariable String id,
            @RequestParam boolean value
    ) {
        return ResponseEntity.ok(service.setConsentDefinitionActive(id, value));
    }
}
