package com.example.demo.arsop.acceso.controller;

import com.example.demo.arsop.acceso.AccesoService;
import com.example.demo.arsop.acceso.dto.AccessResponseDTO;
import com.example.demo.arsop.common.dto.VerifyIdentityDTO;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
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
@RequestMapping("/api/arso/access")
@RequiredArgsConstructor
public class AccessController {

    private final AccesoService accesoService;

    @PatchMapping("/{requestId}/verify-identity")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> verifyIdentity(
            @PathVariable UUID requestId,
            @RequestBody VerifyIdentityDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Verificación de identidad actualizada",
                        accesoService.verifyIdentity(requestId, dto.getVerified(), dto.getComment())
                )
        );
    }

    @PatchMapping("/{requestId}/respond")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> respondRequest(
            @PathVariable UUID requestId,
            @RequestBody AccessResponseDTO dto) {

        return ResponseEntity.ok(
                new ApiResponseDTO<>(
                        true,
                        "Solicitud respondida correctamente",
                        accesoService.respondRequest(requestId, dto)
                )
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> create(
            @RequestBody ArcoRequestCreateDTO dto) {

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Solicitud de acceso creada correctamente",
                accesoService.crear(dto)
        ));
    }

    @PostMapping("/{requestId}/response-document")
    public ResponseEntity<ApiResponseDTO<ArcoRequest>> uploadResponseDocument(
            @PathVariable UUID requestId,
            @RequestParam("file") MultipartFile file) {

        ArcoRequest updated = accesoService.uploadResponseDocument(requestId, file);
        return ResponseEntity.ok(new ApiResponseDTO<>(
                true, "Documento de respuesta adjuntado correctamente", updated));
    }

    @GetMapping("/{requestId}/response-document")
    public ResponseEntity<byte[]> downloadResponseDocument(@PathVariable UUID requestId) {
        try (InputStream stream = accesoService.downloadResponseDocument(requestId)) {
            String contentType = accesoService.getResponseDocumentContentType(requestId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(stream.readAllBytes());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}

