package com.privdata.bff_api.controller;

import com.privdata.bff_api.dtos.request.LoginRequestDTO;
import com.privdata.bff_api.dtos.request.RegisterRequestDTO;
import com.privdata.bff_api.service.AuthBffService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthBffController {

    private final AuthBffService authBffService;

    public AuthBffController(AuthBffService authBffService){
        this.authBffService = authBffService;
    }

    //Endpoint login del BFF
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authBffService.login(request));
    }
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequestDTO request) {
        return ResponseEntity.ok(authBffService.register(request));
    }

    @GetMapping("/me")
    public Map<String, Object> me(@RequestHeader("Authorization") String authorization){
        return authBffService.me(authorization);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) String organizationId
    ) {
        return ResponseEntity.ok(authBffService.getUsers(authorization, organizationId));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserById(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String userId
    ) {
        return ResponseEntity.ok(authBffService.getUserById(authorization, userId));
    }

    @PostMapping("/users/{userId}/roles")
    public ResponseEntity<?> assignRole(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String userId,
            @RequestBody Map<String, Object> body
    ) {
        return ResponseEntity.ok(authBffService.assignRole(authorization, userId, body));
    }

    @GetMapping("/roles")
    public ResponseEntity<?> getRoles(@RequestHeader("Authorization") String authorization) {
        return ResponseEntity.ok(authBffService.getRoles(authorization));
    }

    @PostMapping("/roles")
    public ResponseEntity<?> createRole(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, Object> body
    ) {
        return ResponseEntity.ok(authBffService.createRole(authorization, body));
    }

    @GetMapping("/permissions")
    public ResponseEntity<?> getPermissions(@RequestHeader("Authorization") String authorization) {
        return ResponseEntity.ok(authBffService.getPermissions(authorization));
    }

    @PostMapping("/roles/{roleId}/permissions")
    public ResponseEntity<?> assignPermission(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String roleId,
            @RequestBody Map<String, Object> body
    ) {
        return ResponseEntity.ok(authBffService.assignPermission(authorization, roleId, body));
    }

    @DeleteMapping("/roles/{roleId}/permissions/{permissionId}")
    public ResponseEntity<?> removePermission(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String roleId,
            @PathVariable String permissionId
    ) {
        return ResponseEntity.ok(authBffService.removePermission(authorization, roleId, permissionId));
    }

    @PostMapping("/me/activate")
    public ResponseEntity<?> activateAccount(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, Object> body
    ) {
        return ResponseEntity.ok(authBffService.activateAccount(authorization, body));
    }

    @GetMapping("/audit")
    public ResponseEntity<?> getAuditLogs(
            @RequestHeader("Authorization") String authorization,
            @RequestParam String organizationId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ResponseEntity.ok(authBffService.getAuditLogs(authorization, organizationId, page, size));
    }
}
