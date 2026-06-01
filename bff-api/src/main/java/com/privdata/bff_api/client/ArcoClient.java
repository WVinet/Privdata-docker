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
public class ArcoClient {

    private final RestClient arcoRestClient;

    public Object findAll(String organizationId) {
        String uri = "/api/arco-request" + (organizationId != null ? "?organizationId=" + organizationId : "");
        return forward("GET", uri, null);
    }

    public Object findById(String id) {
        return forward("GET", "/api/arco-request/" + id, null);
    }

    public Object findByDataSubject(String dataSubjectId) {
        return forward("GET", "/api/arco-request/by-subject/" + dataSubjectId, null);
    }

    public Object create(Map<String, Object> body) {
        return forward("POST", "/api/arco-request", body);
    }

    public Object updateStatus(String id, Map<String, Object> body) {
        return forward("PATCH", "/api/arco-request/" + id + "/status", body);
    }

    private Object forward(String method, String uri, Object body) {
        try {
            var spec = arcoRestClient.method(HttpMethod.valueOf(method)).uri(uri);
            if (body != null) spec = spec.contentType(MediaType.APPLICATION_JSON).body(body);
            return spec.retrieve().body(Object.class);
        } catch (HttpClientErrorException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Arco-service error " + ex.getStatusCode() + ": " + ex.getResponseBodyAsString());
            err.put("data", null);
            return err;
        } catch (HttpServerErrorException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Error interno en Arco-service (" + ex.getStatusCode() + "): " + ex.getResponseBodyAsString());
            err.put("data", null);
            return err;
        } catch (ResourceAccessException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Arco-service no disponible: " + ex.getMessage());
            err.put("data", null);
            return err;
        }
    }
}
