package com.privdata.bff_api.client;

import com.privdata.bff_api.dtos.request.LoginRequestDTO;
import com.privdata.bff_api.dtos.request.RegisterRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AuthClient {

    private final RestClient authRestClient;

    public String health() {
        return authRestClient.get()
                .uri("/api/health")
                .retrieve()
                .body(String.class);
    }

    public Map<String, Object> login(LoginRequestDTO requestBody) {
        try {
            return authRestClient.post()
                    .uri("/api/auth/login")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

        } catch (HttpClientErrorException.Unauthorized ex) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Credenciales inválidas");
            response.put("data", null);
            return response;
        }
    }

    public Map<String, Object> register(RegisterRequestDTO requestBody) {
        try {
            return authRestClient.post()
                    .uri("/api/auth/register")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

        } catch (HttpClientErrorException.BadRequest ex) {
            return Map.of(
                    "success", false,
                    "message", "Solicitud inválida",
                    "data", ex.getResponseBodyAsString()
            );

        } catch (HttpClientErrorException.Conflict ex) {
            return Map.of(
                    "success", false,
                    "message", "El usuario ya existe",
                    "data", ex.getResponseBodyAsString()
            );

        } catch (HttpClientErrorException ex) {
            return Map.of(
                    "success", false,
                    "message", "Error desde AuthService",
                    "data", ex.getMessage()
            );
        }
    }

    public Map<String, Object> me(String authorization) {
        try {
            return authRestClient.get()
                    .uri("/api/auth/me")
                    .header("Authorization", authorization)
                    .retrieve()
                    .body(Map.class);

        } catch (HttpClientErrorException.Unauthorized ex) {
            return Map.of(
                    "success", false,
                    "message", "Sesión inválida o expirada",
                    "data", null
            );
        }
    }
}