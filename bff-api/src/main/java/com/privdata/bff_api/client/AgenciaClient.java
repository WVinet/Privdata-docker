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
public class AgenciaClient {

    private final RestClient agenciaRestClient;

    public Object findAll(String status, int page, int size, String authorization) {
        String uri = "/api/agency-claims?page=" + page + "&size=" + size
                + (status != null ? "&status=" + status : "");
        return forward("GET", uri, null, authorization);
    }

    public Object findById(String id, String authorization) {
        return forward("GET", "/api/agency-claims/" + id, null, authorization);
    }

    public Object arcoOverview(String organizationId, String authorization) {
        String uri = "/api/agency-claims/arco-overview" + (organizationId != null ? "?organizationId=" + organizationId : "");
        return forward("GET", uri, null, authorization);
    }

    public Object respond(String id, Map<String, Object> body, String authorization) {
        return forward("PATCH", "/api/agency-claims/" + id + "/respond", body, authorization);
    }

    // Agencia-service SÍ valida el JWT (es el primer microservicio downstream que lo hace),
    // así que a diferencia del forward() de ArcoClient/OrganizationClient (que confían en la red interna),
    // este reenvía el header Authorization tal cual llega del frontend.
    private Object forward(String method, String uri, Object body, String authorization) {
        try {
            var spec = agenciaRestClient.method(HttpMethod.valueOf(method)).uri(uri);
            if (authorization != null) spec = spec.header("Authorization", authorization);
            if (body != null) spec = spec.contentType(MediaType.APPLICATION_JSON).body(body);
            return spec.retrieve().body(Object.class);
        } catch (HttpClientErrorException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", extractMessage(ex.getResponseBodyAsString(), "Agencia-service error " + ex.getStatusCode()));
            err.put("data", null);
            return err;
        } catch (HttpServerErrorException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Error interno en Agencia-service (" + ex.getStatusCode() + "): " + ex.getResponseBodyAsString());
            err.put("data", null);
            return err;
        } catch (ResourceAccessException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Agencia-service no disponible: " + ex.getMessage());
            err.put("data", null);
            return err;
        }
    }

    private String extractMessage(String responseBody, String fallback) {
        var m = java.util.regex.Pattern.compile("\"mensaje\"\\s*:\\s*\"([^\"]+)\"").matcher(responseBody);
        return m.find() ? m.group(1) : fallback;
    }
}
