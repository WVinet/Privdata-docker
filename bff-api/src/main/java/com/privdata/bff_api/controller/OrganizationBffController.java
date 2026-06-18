package com.privdata.bff_api.controller;

import com.privdata.bff_api.service.OrganizationBffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationBffController {

    private final OrganizationBffService service;

    // ── Organizaciones ────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(service.listOrganizations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getOrganization(id));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.createOrganization(body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updateOrganization(id, body));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updateOrganizationStatus(id, body));
    }

    // ── Departamentos ─────────────────────────────────────────────────────────

    @GetMapping("/{orgId}/departments")
    public ResponseEntity<?> listDepartments(@PathVariable String orgId) {
        return ResponseEntity.ok(service.listDepartments(orgId));
    }

    @GetMapping("/{orgId}/departments/{deptId}")
    public ResponseEntity<?> getDepartment(@PathVariable String orgId, @PathVariable String deptId) {
        return ResponseEntity.ok(service.getDepartment(orgId, deptId));
    }

    @PostMapping("/{orgId}/departments")
    public ResponseEntity<?> createDepartment(@PathVariable String orgId, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.createDepartment(orgId, body));
    }

    @PutMapping("/{orgId}/departments/{deptId}")
    public ResponseEntity<?> updateDepartment(
            @PathVariable String orgId, @PathVariable String deptId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updateDepartment(orgId, deptId, body));
    }

    @PatchMapping("/{orgId}/departments/{deptId}/status")
    public ResponseEntity<?> updateDepartmentStatus(
            @PathVariable String orgId, @PathVariable String deptId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updateDepartmentStatus(orgId, deptId, body));
    }

    // ── Cargos ────────────────────────────────────────────────────────────────

    @GetMapping("/{orgId}/job-positions")
    public ResponseEntity<?> listJobPositions(@PathVariable String orgId) {
        return ResponseEntity.ok(service.listJobPositions(orgId));
    }

    @GetMapping("/{orgId}/job-positions/{jobPositionId}")
    public ResponseEntity<?> getJobPosition(@PathVariable String orgId, @PathVariable String jobPositionId) {
        return ResponseEntity.ok(service.getJobPosition(orgId, jobPositionId));
    }

    @PostMapping("/{orgId}/job-positions")
    public ResponseEntity<?> createJobPosition(@PathVariable String orgId, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.createJobPosition(orgId, body));
    }

    @PutMapping("/{orgId}/job-positions/{jobPositionId}")
    public ResponseEntity<?> updateJobPosition(
            @PathVariable String orgId, @PathVariable String jobPositionId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updateJobPosition(orgId, jobPositionId, body));
    }

    @PatchMapping("/{orgId}/job-positions/{jobPositionId}/status")
    public ResponseEntity<?> updateJobPositionStatus(
            @PathVariable String orgId, @PathVariable String jobPositionId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updateJobPositionStatus(orgId, jobPositionId, body));
    }

    // ── Personas ──────────────────────────────────────────────────────────────

    @GetMapping("/{orgId}/persons/{personId}")
    public ResponseEntity<?> getPerson(@PathVariable String orgId, @PathVariable String personId) {
        return ResponseEntity.ok(service.getPerson(orgId, personId));
    }

    @GetMapping("/{orgId}/persons")
    public ResponseEntity<?> listPersons(
            @PathVariable String orgId,
            @RequestParam(required = false) String departmentId) {
        return ResponseEntity.ok(service.listPersons(orgId, departmentId));
    }

    @PostMapping("/{orgId}/persons/invite")
    public ResponseEntity<?> invitePerson(
            @PathVariable String orgId,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.invitePerson(orgId, body, authorization));
    }

    @PutMapping("/{orgId}/persons/{personId}")
    public ResponseEntity<?> updatePerson(
            @PathVariable String orgId, @PathVariable String personId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updatePerson(orgId, personId, body));
    }

    @PatchMapping("/{orgId}/persons/{personId}/status")
    public ResponseEntity<?> updatePersonStatus(
            @PathVariable String orgId, @PathVariable String personId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updatePersonStatus(orgId, personId, body));
    }

    @PostMapping("/{orgId}/persons/{personId}/anonymize")
    public ResponseEntity<?> anonymizePerson(
            @PathVariable String orgId, @PathVariable String personId) {
        return ResponseEntity.ok(service.anonymizePerson(orgId, personId));
    }
}
