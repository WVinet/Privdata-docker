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
}
