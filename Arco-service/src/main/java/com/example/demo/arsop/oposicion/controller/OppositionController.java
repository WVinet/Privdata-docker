package com.example.demo.arsop.oposicion.controller;

import com.example.demo.arsop.common.dto.VerifyIdentityDTO;
import com.example.demo.arsop.oposicion.dto.CreateOppositionDTO;
import com.example.demo.arsop.oposicion.dto.OppositionResponseDTO;
import com.example.demo.arsop.oposicion.service.OppositionService;
import com.example.demo.model.ArcoRequest;
import com.example.demo.shared.ApiResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@RestController
@RequestMapping("/api/arso/opposition")
@RequiredArgsConstructor
public class OppositionController {

    private final OppositionService oposicionService;

    @PostMapping
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> crear(
            @RequestBody CreateOppositionDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Solicitud de oposición creada correctamente",
                        oposicionService.crear(
                                dto.getArcoRequest(),
                                dto.getCause(),
                                dto.getReason(),
                                dto.getProcessingPurpose(),
                                dto.getOpposedTreatment(),
                                dto.getTreatmentActivityId()
                        )
                )
        );
    }

    @PatchMapping("/{requestId}/verify-identity")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> verifyIdentity(
            @PathVariable UUID requestId,
            @RequestBody VerifyIdentityDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Identidad verificada",
                        oposicionService.verifyIdentity(
                                requestId,
                                dto
                        )
                )
        );
    }

    @PatchMapping("/{requestId}/respond")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> respond(
            @PathVariable UUID requestId,
            @RequestBody OppositionResponseDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Solicitud de oposición respondida",
                        oposicionService.respondRequest(requestId, dto)
                )
        );
    }

    @PostMapping("/{requestId}/document")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> uploadDocument(
            @PathVariable UUID requestId,
            @RequestParam("file") MultipartFile file) {

        ArcoRequest updated = oposicionService.uploadSupportingDocument(requestId, file);
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Documento adjuntado correctamente", updated));
    }

    @GetMapping("/{requestId}/document")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable UUID requestId) {
        try (InputStream stream = oposicionService.downloadSupportingDocument(requestId)) {
            String contentType = oposicionService.getSupportingDocumentContentType(requestId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(stream.readAllBytes());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}