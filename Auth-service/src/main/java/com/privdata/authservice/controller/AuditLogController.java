package com.privdata.authservice.controller;

import com.privdata.authservice.dto.request.AuditLogRequest;
import com.privdata.authservice.dto.response.AuditLogResponse;
import com.privdata.authservice.service.AuditLogService;
import com.privdata.authservice.shared.ApiResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/audit")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    // Llamado internamente desde el BFF — no requiere token
    @PostMapping
    public ResponseEntity<Void> log(@RequestBody AuditLogRequest request) {
        auditLogService.log(request);
        return ResponseEntity.ok().build();
    }

    // Consultado por el frontend a través del BFF — requiere token
    @GetMapping
    public ResponseEntity<ApiResponseDTO<Page<AuditLogResponse>>> list(
            @RequestParam String organizationId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Eventos de auditoría obtenidos",
                auditLogService.list(organizationId, page, size)
        ));
    }
}
