package com.privdata.bff_api.client;

import com.privdata.bff_api.dtos.request.LoginRequestDTO;
import com.privdata.bff_api.dtos.request.RegisterRequestDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

//Cliente encargado de comunicarse con Auth-service
@Component
public class AuthClient {

    private final RestClient restClient;

    //url base del auth-service desde application.properties
    @Value("${services.auth.url}")
    private String authserviceUrl;

    //inyectamos el cliente HTTP
    public AuthClient(RestClient restClient){
        this.restClient = restClient;
    }

    public String health() {
        return restClient.get()
                .uri("/api/health")
                .retrieve()
                .body(String.class);
    }

    public Map<String, Object> login(LoginRequestDTO requestBody) {
        try {
            return restClient.post()
                    .uri(authserviceUrl + "/api/auth/login")
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
            return restClient.post()
                    .uri(authserviceUrl + "/api/auth/register")
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
            return restClient.get()
                    .uri(authserviceUrl + "/api/auth/me")
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
