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

    public Object revokeConsent(String consentId, Object body) {
        return forward("POST", "/api/compliance/consents/" + consentId + "/revoke",
                body != null ? body : new HashMap<>());
    }

    public Object getRat(String organizationId, String status) {
        StringBuilder uri = new StringBuilder("/api/compliance/rat");
        if (organizationId != null) {
            uri.append("?organizationId=").append(organizationId);
            if (status != null && !status.isBlank()) uri.append("&status=").append(status);
        }
        return forward("GET", uri.toString(), null);
    }

    public Object createRat(Object body) {
        return forward("POST", "/api/compliance/rat", body);
    }

    public Object updateRat(String id, Object body) {
        return forward("PUT", "/api/compliance/rat/" + id, body);
    }

    public Object getDataCategories() {
        return forward("GET", "/api/compliance/data-categories", null);
    }

    public Object listConsents(String status, Integer page, Integer size) {
        StringBuilder uri = new StringBuilder("/api/compliance/consents?size=")
                .append(size != null ? size : 100)
                .append("&page=").append(page != null ? page : 0);
        if (status != null && !status.isBlank()) uri.append("&status=").append(status);
        return forward("GET", uri.toString(), null);
    }

    public Object createConsent(Object body) {
        return forward("POST", "/api/compliance/consents", body);
    }

    public Object grantConsent(String consentId, Object body) {
        return forward("POST", "/api/compliance/consents/" + consentId + "/grant",
                body != null ? body : new HashMap<>());
    }

    public Object getPendingConsents(String organizationId, String personId) {
        return forward("GET", "/api/compliance/consents/pending?organizationId=" + organizationId + "&personId=" + personId, null);
    }

    public Object getConsentDefinitions(String organizationId) {
        return forward("GET", "/api/compliance/consent-definitions?organizationId=" + organizationId, null);
    }

    public Object createConsentDefinition(Object body) {
        return forward("POST", "/api/compliance/consent-definitions", body);
    }

    public Object setConsentDefinitionActive(String id, boolean value) {
        return forward("PATCH", "/api/compliance/consent-definitions/" + id + "/active?value=" + value, null);
    }

    public Object getTerceros(String organizationId, Boolean onlyActive) {
        StringBuilder uri = new StringBuilder("/api/compliance/terceros?organizationId=").append(organizationId);
        if (Boolean.TRUE.equals(onlyActive)) uri.append("&onlyActive=true");
        return forward("GET", uri.toString(), null);
    }

    public Object getTerceroById(String id) {
        return forward("GET", "/api/compliance/terceros/" + id, null);
    }

    public Object createTercero(Object body) {
        return forward("POST", "/api/compliance/terceros", body);
    }

    public Object updateTercero(String id, Object body) {
        return forward("PUT", "/api/compliance/terceros/" + id, body);
    }

    public Object deleteTercero(String id) {
        return forward("DELETE", "/api/compliance/terceros/" + id, null);
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
