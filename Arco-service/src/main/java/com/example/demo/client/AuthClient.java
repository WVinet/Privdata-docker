package com.example.demo.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthClient {

    private final RestClient restClient;

    @Value("${services.auth.url}")
    private String authServiceUrl;

    public void updateEmailByPersonId(UUID personId, String newEmail) {
        restClient.patch()
                .uri(authServiceUrl + "/api/auth/users/by-person/" + personId + "/email?newEmail=" + newEmail)
                .retrieve()
                .toBodilessEntity();
    }

    public void disableByPersonId(UUID personId) {
        restClient.post()
                .uri(authServiceUrl + "/api/auth/users/by-person/" + personId + "/disable")
                .retrieve()
                .toBodilessEntity();
    }
}
