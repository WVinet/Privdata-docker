package com.privdata.authservice.controller;

import com.privdata.authservice.shared.ApiResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// Controlador simple para probar autorización por rol
@RestController
public class AccessTestController {

    @GetMapping("/user/test")
    public ResponseEntity<ApiResponseDTO<String>> userAccess() {
        return ResponseEntity.ok(
                new ApiResponseDTO<>(true, "Acceso permitido para USER", "USER OK")
        );
    }

    @GetMapping("/admin/test")
    public ResponseEntity<ApiResponseDTO<String>> adminAccess() {
        return ResponseEntity.ok(
                new ApiResponseDTO<>(true, "Acceso permitido para ADMIN", "ADMIN OK")
        );
    }

    @GetMapping("/superadmin/test")
    public ResponseEntity<ApiResponseDTO<String>> superAdminAccess() {
        return ResponseEntity.ok(
                new ApiResponseDTO<>(true, "Acceso permitido para SUPER_ADMIN", "SUPER_ADMIN OK")
        );
    }

    @GetMapping("/company/test")
    public ResponseEntity<ApiResponseDTO<String>> companyAccess() {
        return ResponseEntity.ok(
                new ApiResponseDTO<>(true, "Acceso permitido para COMPANY", "COMPANY OK")
        );
    }
}