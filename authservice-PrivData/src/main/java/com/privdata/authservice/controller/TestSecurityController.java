package com.privdata.authservice.controller;

import com.privdata.authservice.shared.ApiResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class TestSecurityController {

    @GetMapping("/arco-view")
    @PreAuthorize("hasAuthority('ARCO_VIEW')")
    public ResponseEntity<ApiResponseDTO<String>> arcoView() {
        return ResponseEntity.ok(
                new ApiResponseDTO<>(true, "Acceso permitido", "Tiene permiso ARCO_VIEW")
        );
    }

    @GetMapping("/arco-create")
    @PreAuthorize("hasAuthority('ARCO_CREATE')")
    public ResponseEntity<ApiResponseDTO<String>> arcoCreate() {
        return ResponseEntity.ok(
                new ApiResponseDTO<>(true, "Acceso permitido", "Tiene permiso ARCO_CREATE")
        );
    }

    @GetMapping("/user-create")
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public ResponseEntity<ApiResponseDTO<String>> userCreate() {
        return ResponseEntity.ok(
                new ApiResponseDTO<>(true, "Acceso permitido", "Tiene permiso USER_CREATE")
        );
    }
}
