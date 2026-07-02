package com.privdata.bff_api.controller;

import com.privdata.bff_api.service.ArcoBffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    public ResponseEntity<?> create(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.create(body, authorization));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.updateStatus(id, body, authorization));
    }

    @PatchMapping("/{id}/start-review")
    public ResponseEntity<?> startReview(@PathVariable String id) {
        return ResponseEntity.ok(service.startReview(id));
    }

    @PatchMapping("/{id}/prorroga")
    public ResponseEntity<?> extendDeadline(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.extendDeadline(id, authorization));
    }

    @PostMapping("/{id}/disconformidad")
    public ResponseEntity<?> registrarDisconformidad(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.registrarDisconformidad(id, body, authorization));
    }

    @PatchMapping("/{id}/verificacion-identidad")
    public ResponseEntity<?> updateVerificacionIdentidad(
            @PathVariable String id,
            @RequestParam String nuevoEstado) {
        return ResponseEntity.ok(service.updateVerificacionIdentidad(id, nuevoEstado));
    }

    @PostMapping("/{id}/reclamo-agencia")
    public ResponseEntity<?> reclamarAnteAgencia(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.reclamarAnteAgencia(id, authorization));
    }

    @PatchMapping("/access/{id}/verify-identity")
    public ResponseEntity<?> verifyAccessIdentity(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.verifyAccessIdentity(id, body, authorization));
    }

    @PatchMapping("/access/{id}/respond")
    public ResponseEntity<?> respondAccess(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.respondAccess(id, body, authorization));
    }

    @PostMapping("/rectification")
    public ResponseEntity<?> createRectification(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.createRectification(body, authorization));
    }

    @PatchMapping("/rectification/{id}/verify-identity")
    public ResponseEntity<?> verifyRectificationIdentity(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.verifyRectificationIdentity(id, body, authorization));
    }

    @PatchMapping("/rectification/{id}/respond")
    public ResponseEntity<?> respondRectification(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.respondRectification(id, body, authorization));
    }

    @PostMapping("/suppression")
    public ResponseEntity<?> createSuppression(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.createSuppression(body, authorization));
    }

    @PatchMapping("/suppression/{id}/verify-identity")
    public ResponseEntity<?> verifySuppressionIdentity(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.verifySuppressionIdentity(id, body, authorization));
    }

    @PatchMapping("/suppression/{id}/respond")
    public ResponseEntity<?> respondSuppression(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.respondSuppression(id, body, authorization));
    }

    @PostMapping("/opposition")
    public ResponseEntity<?> createOpposition(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.createOpposition(body, authorization));
    }

    @PatchMapping("/opposition/{id}/verify-identity")
    public ResponseEntity<?> verifyOppositionIdentity(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.verifyOppositionIdentity(id, body, authorization));
    }

    @PatchMapping("/opposition/{id}/respond")
    public ResponseEntity<?> respondOpposition(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.respondOpposition(id, body, authorization));
    }

    @PostMapping("/portability")
    public ResponseEntity<?> createPortability(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.createPortability(body, authorization));
    }

    @PatchMapping("/portability/{id}/verify-identity")
    public ResponseEntity<?> verifyPortabilityIdentity(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.verifyPortabilityIdentity(id, body, authorization));
    }

    @PatchMapping("/portability/{id}/respond")
    public ResponseEntity<?> respondPortability(
            @PathVariable String id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.respondPortability(id, body, authorization));
    }

    @GetMapping("/portability/{id}/download")
    public ResponseEntity<byte[]> downloadPortability(@PathVariable String id) {
        return service.downloadPortability(id);
    }

    @PostMapping("/rectification/{id}/document")
    public ResponseEntity<?> uploadRectificationDocument(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.uploadRectificationDocument(id, file, authorization));
    }

    @GetMapping("/rectification/{id}/document")
    public ResponseEntity<byte[]> downloadRectificationDocument(@PathVariable String id) {
        return service.downloadRectificationDocument(id);
    }

    @PostMapping("/access/{id}/response-document")
    public ResponseEntity<?> uploadAccessResponseDocument(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.uploadAccessResponseDocument(id, file, authorization));
    }

    @GetMapping("/access/{id}/response-document")
    public ResponseEntity<byte[]> downloadAccessResponseDocument(@PathVariable String id) {
        return service.downloadAccessResponseDocument(id);
    }

    @PostMapping("/opposition/{id}/document")
    public ResponseEntity<?> uploadOppositionDocument(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.uploadOppositionDocument(id, file, authorization));
    }

    @GetMapping("/opposition/{id}/document")
    public ResponseEntity<byte[]> downloadOppositionDocument(@PathVariable String id) {
        return service.downloadOppositionDocument(id);
    }

    @PatchMapping("/{id}/block")
    public ResponseEntity<?> applyBlock(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.applyBlock(id, authorization));
    }

    @PatchMapping("/{id}/unblock")
    public ResponseEntity<?> liftBlock(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return ResponseEntity.ok(service.liftBlock(id, authorization));
    }

}
