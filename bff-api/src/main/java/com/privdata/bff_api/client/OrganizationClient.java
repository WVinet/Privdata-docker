package com.privdata.bff_api.client;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

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

    // ── Organizaciones ────────────────────────────────────────────────────────

    public Object listOrganizations() {
        return forward("GET", "/api/organizations", null);
    }

    public Object getOrganization(String id) {
        return forward("GET", "/api/organizations/" + id, null);
    }

    public Object createOrganization(Map<String, Object> body) {
        return forward("POST", "/api/organizations", body);
    }

    public Object updateOrganization(String id, Map<String, Object> body) {
        return forward("PUT", "/api/organizations/" + id, body);
    }

    public Object updateOrganizationStatus(String id, Map<String, Object> body) {
        return forward("PATCH", "/api/organizations/" + id + "/status", body);
    }

    // ── Departamentos ─────────────────────────────────────────────────────────

    public Object listDepartments(String orgId) {
        return forward("GET", "/api/organizations/" + orgId + "/departments", null);
    }

    public Object getDepartment(String orgId, String deptId) {
        return forward("GET", "/api/organizations/" + orgId + "/departments/" + deptId, null);
    }

    public Object createDepartment(String orgId, Map<String, Object> body) {
        return forward("POST", "/api/organizations/" + orgId + "/departments", body);
    }

    public Object updateDepartment(String orgId, String deptId, Map<String, Object> body) {
        return forward("PUT", "/api/organizations/" + orgId + "/departments/" + deptId, body);
    }

    public Object updateDepartmentStatus(String orgId, String deptId, Map<String, Object> body) {
        return forward("PATCH", "/api/organizations/" + orgId + "/departments/" + deptId + "/status", body);
    }

    // ── Personas ──────────────────────────────────────────────────────────────

    public Object getPerson(String orgId, String personId) {
        return forward("GET", "/api/organizations/" + orgId + "/persons/" + personId, null);
    }

    public Object listPersons(String orgId, String departmentId) {
        String uri = "/api/organizations/" + orgId + "/persons";
        if (departmentId != null) uri += "?departmentId=" + departmentId;
        return forward("GET", uri, null);
    }

    public Object createPerson(String orgId, Map<String, Object> body) {
        return forward("POST", "/api/organizations/" + orgId + "/persons", body);
    }

    public Object updatePerson(String orgId, String personId, Map<String, Object> body) {
        return forward("PUT", "/api/organizations/" + orgId + "/persons/" + personId, body);
    }

    public Object updatePersonStatus(String orgId, String personId, Map<String, Object> body) {
        return forward("PATCH", "/api/organizations/" + orgId + "/persons/" + personId + "/status", body);
    }

    public Object anonymizePerson(String orgId, String personId) {
        return forward("POST", "/api/organizations/" + orgId + "/persons/" + personId + "/anonymize", null);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Object forward(String method, String uri, Object body) {
        try {
            var spec = organizationRestClient
                    .method(HttpMethod.valueOf(method))
                    .uri(uri);
            if (body != null) spec = spec.contentType(MediaType.APPLICATION_JSON).body(body);
            return spec.retrieve().body(Object.class);
        } catch (HttpClientErrorException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", extractMessage(ex.getResponseBodyAsString(), ex.getStatusText()));
            err.put("data", null);
            return err;
        } catch (HttpServerErrorException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Error interno en Organization-service: " + extractMessage(ex.getResponseBodyAsString(), ex.getStatusCode().toString()));
            err.put("data", null);
            return err;
        } catch (ResourceAccessException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Organization-service no disponible");
            err.put("data", null);
            return err;
        }
    }

    private String extractMessage(String responseBody, String fallback) {
        var m = java.util.regex.Pattern.compile("\"message\"\\s*:\\s*\"([^\"]+)\"").matcher(responseBody);
        return m.find() ? m.group(1) : fallback;
    }
}
