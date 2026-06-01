package com.privdata.bff_api.controller;

import com.privdata.bff_api.service.ArcoBffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/arco")
@RequiredArgsConstructor
public class ArcoBffController {

    private final ArcoBffService service;

    @GetMapping
    public ResponseEntity<?> findAll(@RequestParam(required = false) String organizationId) {
        return ResponseEntity.ok(service.findAll(organizationId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable String id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/by-subject/{dataSubjectId}")
    public ResponseEntity<?> findByDataSubject(@PathVariable String dataSubjectId) {
        return ResponseEntity.ok(service.findByDataSubject(dataSubjectId));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.create(body));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.updateStatus(id, body));
    }
}
