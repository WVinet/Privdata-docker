package com.privdata.authservice.controller;

import com.privdata.authservice.dto.request.ForgotPasswordRequest;
import com.privdata.authservice.dto.request.ResetPasswordRequest;
import com.privdata.authservice.service.PasswordResetService;
import com.privdata.authservice.shared.ApiResponseDTO;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/password")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/forgot")
    public ResponseEntity<ApiResponseDTO<Void>> forgotPassword(
            @RequestBody ForgotPasswordRequest request
    ) {
        passwordResetService.requestPasswordReset(request.getEmail());

        return ResponseEntity.ok(
                new ApiResponseDTO<>(true, "Código enviado al correo", null)
        );
    }

    @PostMapping("/reset")
    public ResponseEntity<ApiResponseDTO<Void>> resetPassword(
            @RequestBody ResetPasswordRequest request
    ) {
        passwordResetService.resetPassword(request);

        return ResponseEntity.ok(
                new ApiResponseDTO<>(true,"Contraseña actualizada correctamente", null)
        );
    }
}
