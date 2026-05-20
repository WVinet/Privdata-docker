package com.privdata.bff_api.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class ComplianceClient {

    private final RestClient complianceRestClient;

    public String health() {
        return complianceRestClient.get()
                .uri("/api/health")
                .retrieve()
                .body(String.class);
    }
}
