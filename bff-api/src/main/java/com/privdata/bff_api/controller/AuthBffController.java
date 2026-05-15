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
}
