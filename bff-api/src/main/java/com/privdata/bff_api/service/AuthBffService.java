package com.privdata.bff_api.service;

import com.privdata.bff_api.client.AuthClient;
import com.privdata.bff_api.dtos.request.LoginRequestDTO;
import com.privdata.bff_api.dtos.request.RegisterRequestDTO;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthBffService {

    private final AuthClient authClient;

    public AuthBffService (AuthClient authClient){
        this.authClient = authClient;
    }

    public Map<String, Object> login(LoginRequestDTO request) {
        return authClient.login(request);
    }

    public Map<String, Object> register(RegisterRequestDTO request) {
        return authClient.register(request);
    }

    public Map<String, Object> me(String authorization){
        return authClient.me(authorization);
    }
}
