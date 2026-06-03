package com.privdata.bff_api.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditClient {

    private final RestClient authRestClient;

    public void log(String organizationId, String action, String entityType,
                    String detail, String performedByEmail) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("organizationId",   organizationId);
            body.put("action",           action);
            body.put("entityType",       entityType);
            body.put("detail",           detail);
            body.put("performedByEmail", performedByEmail);

            authRestClient.post()
                    .uri("/api/auth/audit")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            // Audit failures must never break the main operation
            log.warn("Audit log failed: {}", e.getMessage());
        }
    }
}
