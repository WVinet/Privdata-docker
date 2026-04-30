package com.privdata.bff_api.client;

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

    //MEtodo para hacer login contra auth-service
    public Map<String, Object> login(Map<String, Object> requestBody) {
        try {
            return restClient.post()
                    .uri(authserviceUrl + "/auth/login")
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

    public Map<String, Object> me(String authorization) {
        try {
            return restClient.get()
                    .uri(authserviceUrl + "/auth/me")
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
