package com.privdata.bff_api.controller;

import com.privdata.bff_api.service.AgenciaBffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/agency-claims")
@RequiredArgsConstructor
public class AgenciaBffController {

    private final AgenciaBffService service;

    @GetMapping
    public ResponseEntity<?> findAll(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.findAll(status, page, size, authorization));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.findById(id, authorization));
    }

    @GetMapping("/arco-overview")
    public ResponseEntity<?> arcoOverview(
            @RequestParam(required = false) String organizationId,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.arcoOverview(organizationId, authorization));
    }

    @PatchMapping("/{id}/respond")
    public ResponseEntity<?> respond(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.respond(id, body, authorization));
    }
}
