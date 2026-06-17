package com.privdata.bff_api.service;

import com.privdata.bff_api.client.AgenciaClient;
import com.privdata.bff_api.client.AuditClient;
import com.privdata.bff_api.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AgenciaBffService {

    private final AgenciaClient agenciaClient;
    private final AuditClient auditClient;

    public Object findAll(String status, int page, int size, String authorization) {
        return agenciaClient.findAll(status, page, size, authorization);
    }

    public Object findById(String id, String authorization) {
        return agenciaClient.findById(id, authorization);
    }

    public Object arcoOverview(String organizationId, String authorization) {
        return agenciaClient.arcoOverview(organizationId, authorization);
    }

    public Object respond(String id, Map<String, Object> body, String authorization) {
        Object result = agenciaClient.respond(id, body, authorization);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Reclamo ante la Agencia",
                "Reclamo " + id + " respondido por la Agencia",
                JwtUtil.extractEmail(authorization));
        return result;
    }

    private String extractDataField(Object result, String key) {
        if (!(result instanceof Map<?, ?> resultMap) || !(resultMap.get("data") instanceof Map<?, ?> data)) return null;
        Object value = data.get(key);
        return value != null ? value.toString() : null;
    }
}
