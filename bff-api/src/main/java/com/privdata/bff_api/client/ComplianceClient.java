package com.privdata.bff_api.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

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

    public Object getConsentsByDataSubject(String dataSubjectId) {
        return forward("GET", "/api/compliance/consents/data-subject/" + dataSubjectId, null);
    }

    public Object getRat(String organizationId) {
        String uri = "/api/compliance/rat" + (organizationId != null ? "?organizationId=" + organizationId + "&status=ACTIVE" : "");
        return forward("GET", uri, null);
    }

    private Object forward(String method, String uri, Object body) {
        try {
            var spec = complianceRestClient
                    .method(org.springframework.http.HttpMethod.valueOf(method))
                    .uri(uri);
            if (body != null) spec = spec.contentType(org.springframework.http.MediaType.APPLICATION_JSON).body(body);
            return spec.retrieve().body(Object.class);
        } catch (HttpClientErrorException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Compliance-service error " + ex.getStatusCode() + ": " + ex.getResponseBodyAsString());
            err.put("data", null);
            return err;
        } catch (HttpServerErrorException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Error interno en Compliance-service (" + ex.getStatusCode() + "): " + ex.getResponseBodyAsString());
            err.put("data", null);
            return err;
        } catch (ResourceAccessException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Compliance-service no disponible: " + ex.getMessage());
            err.put("data", null);
            return err;
        }
    }
}
