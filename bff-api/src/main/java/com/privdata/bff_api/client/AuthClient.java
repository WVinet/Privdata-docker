package com.privdata.bff_api.client;

import com.privdata.bff_api.dtos.request.LoginRequestDTO;
import com.privdata.bff_api.dtos.request.RegisterRequestDTO;
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
public class AuthClient {

    private final RestClient authRestClient;

    public String health() {
        return authRestClient.get()
                .uri("/api/health")
                .retrieve()
                .body(String.class);
    }

    public Map<String, Object> login(LoginRequestDTO requestBody) {
        try {
            return authRestClient.post()
                    .uri("/api/auth/login")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

        } catch (HttpClientErrorException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", ex.getResponseBodyAsString());
            err.put("data", null);
            return err;
        }
    }

    public Map<String, Object> register(RegisterRequestDTO requestBody) {
        try {
            return authRestClient.post()
                    .uri("/api/auth/register")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

        } catch (HttpClientErrorException.BadRequest ex) {
            return Map.of(
                    "success", false,
                    "message", "Solicitud inválida",
                    "data", ex.getResponseBodyAsString()
            );

        } catch (HttpClientErrorException.Conflict ex) {
            return Map.of(
                    "success", false,
                    "message", "El usuario ya existe",
                    "data", ex.getResponseBodyAsString()
            );

        } catch (HttpClientErrorException ex) {
            return Map.of(
                    "success", false,
                    "message", "Error desde AuthService",
                    "data", ex.getMessage()
            );
        }
    }

    public Map<String, Object> me(String authorization) {
        try {
            return authRestClient.get()
                    .uri("/api/auth/me")
                    .header("Authorization", authorization)
                    .retrieve()
                    .body(Map.class);

        } catch (HttpClientErrorException.Unauthorized ex) {
            return Map.of("success", false, "message", "Sesión inválida o expirada", "data", null);
        }
    }

    public Object getUsers(String authorization, String organizationId) {
        String uri = organizationId != null
                ? "/api/auth/users?organizationId=" + organizationId
                : "/api/auth/users";
        return forward("GET", uri, authorization, null);
    }

    public Object getUserById(String authorization, String userId) {
        return forward("GET", "/api/auth/users/" + userId, authorization, null);
    }

    public Object assignRole(String authorization, String userId, Map<String, Object> body) {
        return forward("POST", "/api/auth/users/" + userId + "/roles", authorization, body);
    }

    public Object getRoles(String authorization) {
        return forward("GET", "/api/auth/roles", authorization, null);
    }

    public Object createRole(String authorization, Map<String, Object> body) {
        return forward("POST", "/api/auth/roles", authorization, body);
    }

    public Object getPermissions(String authorization) {
        return forward("GET", "/api/auth/permissions", authorization, null);
    }

    public Object assignPermission(String authorization, String roleId, Map<String, Object> body) {
        return forward("POST", "/api/auth/roles/" + roleId + "/permissions", authorization, body);
    }

    public Object removePermission(String authorization, String roleId, String permissionId) {
        return forward("DELETE", "/api/auth/roles/" + roleId + "/permissions/" + permissionId, authorization, null);
    }

    public Object invite(String authorization, Map<String, Object> body) {
        return forward("POST", "/api/auth/invite", authorization, body);
    }

    public Object activateAccount(String authorization, Map<String, Object> body) {
        return forward("POST", "/api/auth/me/activate", authorization, body);
    }

    public Object getAuditLogs(String authorization, String organizationId, int page, int size, String search) {
        String uri = "/api/auth/audit?organizationId=" + organizationId
                + "&page=" + page + "&size=" + size;
        if (search != null && !search.isBlank()) {
            uri += "&search=" + java.net.URLEncoder.encode(search.trim(), java.nio.charset.StandardCharsets.UTF_8);
        }
        return forward("GET", uri, authorization, null);
    }

    public void sendArcoResolutionEmail(Map<String, Object> body) {
        authRestClient.post()
                .uri("/api/auth/notifications/arco-resolution")
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }

    public Map<String, Object> forgotPassword(Map<String, Object> body) {
        try {
            return authRestClient.post()
                    .uri("/api/auth/password/forgot")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return errorFromBody(ex.getResponseBodyAsString(), ex.getStatusText());
        } catch (ResourceAccessException ex) {
            return Map.of("success", false, "message", "Auth-service no disponible", "data", null);
        }
    }

    public Map<String, Object> resetPassword(Map<String, Object> body) {
        try {
            return authRestClient.post()
                    .uri("/api/auth/password/reset")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return errorFromBody(ex.getResponseBodyAsString(), ex.getStatusText());
        } catch (ResourceAccessException ex) {
            return Map.of("success", false, "message", "Auth-service no disponible", "data", null);
        }
    }

    private Map<String, Object> errorFromBody(String responseBody, String fallback) {
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("\"message\"\\s*:\\s*\"([^\"]+)\"")
                .matcher(responseBody);
        String message = m.find() ? m.group(1) : fallback;
        Map<String, Object> err = new HashMap<>();
        err.put("success", false);
        err.put("message", message);
        err.put("data", null);
        return err;
    }

    private Object forward(String method, String uri, String authorization, Object body) {
        try {
            var spec = authRestClient.method(org.springframework.http.HttpMethod.valueOf(method))
                    .uri(uri)
                    .header("Authorization", authorization);
            if (body != null) spec = spec.contentType(org.springframework.http.MediaType.APPLICATION_JSON).body(body);
            return spec.retrieve().body(Object.class);
        } catch (HttpClientErrorException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", ex.getStatusText());
            err.put("data", null);
            return err;
        } catch (HttpServerErrorException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Error interno en Auth-service: " + ex.getStatusCode());
            err.put("data", null);
            return err;
        } catch (ResourceAccessException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Auth-service no disponible");
            err.put("data", null);
            return err;
        }
    }
}