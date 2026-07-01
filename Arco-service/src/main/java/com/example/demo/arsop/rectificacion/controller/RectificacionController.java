package com.example.demo.arsop.rectificacion.controller;

import com.example.demo.arsop.common.dto.VerifyIdentityDTO;
import com.example.demo.arsop.rectificacion.service.RectificacionService;
import com.example.demo.arsop.rectificacion.dto.RectificationResponseDTO;
import com.example.demo.dto.request.PersonRectificationRequestDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.model.ArcoRequest;
import com.example.demo.shared.ApiResponseDTO;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@RestController
@RequestMapping("/api/arso/rectification")
@RequiredArgsConstructor
public class RectificacionController {

    private final RectificacionService rectificacionService;

    @PostMapping
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> crear(
            @RequestBody CreateRectificationRequestDTO dto) {

        ArcoRequest response = rectificacionService.crear(
                dto.getArcoRequest(),
                dto.getRectificationData()
        );

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Solicitud de rectificación creada correctamente",
                response
        ));
    }

    @PatchMapping("/{requestId}/verify-identity")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> verifyIdentity(
            @PathVariable UUID requestId,
            @RequestBody VerifyIdentityDTO dto) {

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Verificación de identidad actualizada",
                rectificacionService.verifyIdentity(requestId, dto)
        ));
    }

    @PatchMapping("/{requestId}/respond")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> respondRequest(
            @PathVariable UUID requestId,
            @RequestBody RectificationResponseDTO dto) {

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Solicitud de rectificación respondida correctamente",
                rectificacionService.respondRequest(requestId, dto)
        ));
    }

    @PostMapping("/{requestId}/document")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> uploadDocument(
            @PathVariable UUID requestId,
            @RequestParam("file") MultipartFile file) {

        ArcoRequest updated = rectificacionService.uploadSupportingDocument(requestId, file);
        return ResponseEntity.ok(new ApiResponseDTO<>(
                true, "Documento de respaldo adjuntado correctamente", updated));
    }

    @GetMapping("/{requestId}/document")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable UUID requestId) {
        try (InputStream stream = rectificacionService.downloadSupportingDocument(requestId)) {
            String contentType = rectificacionService.getSupportingDocumentContentType(requestId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(stream.readAllBytes());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Data
    public static class CreateRectificationRequestDTO {
        private ArcoRequestCreateDTO arcoRequest;
        private PersonRectificationRequestDTO rectificationData;
    }
}