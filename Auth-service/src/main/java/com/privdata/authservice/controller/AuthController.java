package com.privdata.authservice.controller;

import com.privdata.authservice.dto.request.ActivateAccountRequestDTO;
import com.privdata.authservice.dto.request.InviteRequestDTO;
import com.privdata.authservice.dto.request.LoginRequestDTO;
import com.privdata.authservice.dto.request.RegisterRequestDTO;
import com.privdata.authservice.dto.response.InviteResponseDTO;
import com.privdata.authservice.dto.response.LoginResponseDTO;
import com.privdata.authservice.dto.response.MeResponseDTO;
import com.privdata.authservice.dto.response.RegisterResponseDTO;
import com.privdata.authservice.dto.response.UserResponseDTO;
import com.privdata.authservice.model.SecurityUser;
import com.privdata.authservice.service.AuthService;
import com.privdata.authservice.shared.ApiResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public ResponseEntity<ApiResponseDTO<RegisterResponseDTO>> register(@Valid @RequestBody RegisterRequestDTO request) {
        RegisterResponseDTO response = authService.register(request);

        ApiResponseDTO<RegisterResponseDTO> apiResponseDTO =
                new ApiResponseDTO<>(true, "Usuario registrado correctamente", response);

        return ResponseEntity.ok(apiResponseDTO);
    }

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('USER_VIEW')")
    public ResponseEntity<ApiResponseDTO<List<UserResponseDTO>>> listUsers(
            @RequestParam(required = false) UUID organizationId
    ) {
        List<UserResponseDTO> users = authService.listUsers(organizationId);
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Usuarios obtenidos correctamente", users));
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasAuthority('USER_VIEW')")
    public ResponseEntity<ApiResponseDTO<UserResponseDTO>> getUserById(@PathVariable UUID userId) {
        UserResponseDTO user = authService.getUserById(userId);
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Usuario obtenido correctamente", user));
    }

    @PostMapping("/invite")
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public ResponseEntity<ApiResponseDTO<InviteResponseDTO>> invite(@Valid @RequestBody InviteRequestDTO request) {
        InviteResponseDTO response = authService.invite(request);
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Invitación creada correctamente", response));
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

    @PostMapping("/me/activate")
    public ResponseEntity<ApiResponseDTO<LoginResponseDTO>> activateAccount(
            Authentication authentication,
            @Valid @RequestBody ActivateAccountRequestDTO request
    ) {
        SecurityUser securityUser = (SecurityUser) authentication.getPrincipal();
        LoginResponseDTO response = authService.activateAccount(securityUser, request);
        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Cuenta activada correctamente", response));
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