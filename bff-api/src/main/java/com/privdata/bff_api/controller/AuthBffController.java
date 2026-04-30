package com.privdata.bff_api.controller;

import com.privdata.bff_api.service.AuthBffService;
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
    public Map<String, Object> login(@RequestBody Map<String, Object> request){
        return authBffService.login(request);
    }

    @GetMapping("/me")
    public Map<String, Object> me(@RequestHeader("Authorization") String authorization){
        return authBffService.me(authorization);
    }
}
