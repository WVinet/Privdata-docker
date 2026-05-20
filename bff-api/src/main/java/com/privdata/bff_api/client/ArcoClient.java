package com.privdata.bff_api.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class ArcoClient {

    private final RestClient arcoRestClient;

    public String health() {
        return arcoRestClient.get()
                .uri("/api/health")
                .retrieve()
                .body(String.class);
    }
}
