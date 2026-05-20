package com.privdata.bff_api.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@RequiredArgsConstructor
public class OrganizationClient {

    private final RestClient organizationRestClient;

    public String health() {
        return organizationRestClient.get()
                .uri("/api/health")
                .retrieve()
                .body(String.class);
    }

}
