package com.privdata.authservice.controller;

import com.privdata.authservice.dto.request.LoginRequestDTO;
import com.privdata.authservice.dto.request.RegisterRequestDTO;
import com.privdata.authservice.dto.response.LoginResponseDTO;
import com.privdata.authservice.dto.response.MeResponseDTO;
import com.privdata.authservice.dto.response.RegisterResponseDTO;
import com.privdata.authservice.model.SecurityUser;
import com.privdata.authservice.service.AuthService;
import com.privdata.authservice.shared.ApiResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponseDTO<RegisterResponseDTO>> register(@Valid @RequestBody RegisterRequestDTO request) {
        RegisterResponseDTO response = authService.register(request);

        ApiResponseDTO<RegisterResponseDTO> apiResponseDTO =
                new ApiResponseDTO<>(true, "Usuario registrado correctamente", response);

        return ResponseEntity.ok(apiResponseDTO);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponseDTO<LoginResponseDTO>> login(@Valid @RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);

        ApiResponseDTO<LoginResponseDTO> apiResponseDTO =
                new ApiResponseDTO<>(true, "Inicio de sesión correcto", response);

        return ResponseEntity.ok(apiResponseDTO);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponseDTO<MeResponseDTO>> me(Authentication authentication) {

        SecurityUser securityUser = (SecurityUser) authentication.getPrincipal();

        MeResponseDTO response = authService.me(securityUser);

        return ResponseEntity.ok(
                new ApiResponseDTO<>(true, "Usuario autenticado obtenido correctamente", response)
        );
    }

    @PostMapping("/users/{userId}/roles")
    @org.springframework.security.access.prepost.PreAuthorize("hasAuthority('ROLE_ASSIGN')")
    public ResponseEntity<ApiResponseDTO<Void>> assignRoleToUser(
            @PathVariable java.util.UUID userId,
            @Valid @RequestBody com.privdata.authservice.dto.request.AssignRoleRequestDTO request
    ) {
        authService.assignRoleToUser(userId, request.getRoleName());

        return ResponseEntity.ok(
                new ApiResponseDTO<>(true, "Rol asignado correctamente", null)
        );
    }
}