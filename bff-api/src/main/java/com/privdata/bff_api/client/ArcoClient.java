package com.privdata.bff_api.client;

import com.privdata.bff_api.dtos.request.arco.ArcoCancellationRequestDTO;
import com.privdata.bff_api.dtos.response.arco.ArcoRequestResponseDTO;
import com.privdata.bff_api.util.JwtUtil;
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
import java.util.UUID;

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

    public Object updateStatus(String id, Map<String, Object> body, String authorization) {
        Map<String, Object> mapped = new HashMap<>();
        mapped.put("newStatus", body.get("status"));
        mapped.put("comment", body.get("resolutionSummary"));
        mapped.put("denialLegalBasis", body.get("denialLegalBasis"));
        String userId = JwtUtil.extractUserId(authorization);
        if (userId != null) mapped.put("changedByUserId", userId);
        mapped.put("changedByEmail", JwtUtil.extractEmail(authorization));
        return forward("PATCH", "/api/arco-request/" + id + "/estado", mapped);
    }

    public Object startReview(String id) {
        return forward("PATCH", "/api/arco-request/" + id + "/iniciar-revision", null);
    }

    public Object extendDeadline(String id) {
        return forward("PATCH", "/api/arco-request/" + id + "/prorroga", null);
    }

    public Object registrarDisconformidad(String id, Map<String, Object> body) {
        return forward("POST", "/api/arco-request/" + id + "/disconformidad", body);
    }

    public Object reclamarAnteAgencia(String id) {
        return forward("POST", "/api/arco-request/" + id + "/reclamo-agencia", null);
    }

    public Object updateVerificacionIdentidad(String id, String nuevoEstado) {
        return forward("PATCH", "/api/arco-request/" + id + "/verificacion-identidad?nuevoEstado=" + nuevoEstado, null);
    }

    public Object verifyAccessIdentity(String id, Map<String, Object> body) {
        return forward("PATCH", "/api/arso/access/" + id + "/verify-identity", body);
    }

    public Object respondAccess(String id, Map<String, Object> body) {
        return forward("PATCH", "/api/arso/access/" + id + "/respond", body);
    }

    public Object createRectification(Map<String, Object> body) {
        return forward("POST", "/api/arso/rectification", body);
    }

    public Object verifyRectificationIdentity(String id, Map<String, Object> body) {
        return forward("PATCH", "/api/arso/rectification/" + id + "/verify-identity", body);
    }

    public Object respondRectification(String id, Map<String, Object> body) {
        return forward("PATCH", "/api/arso/rectification/" + id + "/respond", body);
    }

    public Object createSuppression(Map<String, Object> body) {
        return forward("POST", "/api/arso/suppression", body);
    }

    public Object verifySuppressionIdentity(String id, Map<String, Object> body) {
        return forward("PATCH", "/api/arso/suppression/" + id + "/verify-identity", body);
    }

    public Object respondSuppression(String id, Map<String, Object> body) {
        return forward("PATCH", "/api/arso/suppression/" + id + "/respond", body);
    }

    public Object createOpposition(Map<String, Object> body) {
        return forward("POST", "/api/arso/opposition", body);
    }

    public Object verifyOppositionIdentity(String id, Map<String, Object> body) {
        return forward("PATCH", "/api/arso/opposition/" + id + "/verify-identity", body);
    }

    public Object respondOpposition(String id, Map<String, Object> body) {
        return forward("PATCH", "/api/arso/opposition/" + id + "/respond", body);
    }

    public Object createPortability(Map<String, Object> body) {
        return forward("POST", "/api/arso/portability", body);
    }

    public Object verifyPortabilityIdentity(String id, Map<String, Object> body) {
        return forward("PATCH", "/api/arso/portability/" + id + "/verify-identity", body);
    }

    public Object respondPortability(String id, Map<String, Object> body) {
        return forward("PATCH", "/api/arso/portability/" + id + "/respond", body);
    }

    public org.springframework.http.ResponseEntity<byte[]> downloadPortability(String id) {
        return arcoRestClient.get()
                .uri("/api/arso/portability/" + id + "/download")
                .retrieve()
                .toEntity(byte[].class);
    }

    private Object forward(String method, String uri, Object body) {
        try {
            var spec = arcoRestClient.method(HttpMethod.valueOf(method)).uri(uri);
            if (body != null) spec = spec.contentType(MediaType.APPLICATION_JSON).body(body);
            return spec.retrieve().body(Object.class);
        } catch (HttpClientErrorException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", extractMessage(ex.getResponseBodyAsString(), "Arco-service error " + ex.getStatusCode()));
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

    private String extractMessage(String responseBody, String fallback) {
        var m = java.util.regex.Pattern.compile("\"mensaje\"\\s*:\\s*\"([^\"]+)\"").matcher(responseBody);
        return m.find() ? m.group(1) : fallback;
    }

    ///metodos de conexion derecho ARCO (Cancelacion)

    public ArcoRequestResponseDTO crearSolicitudCancelacion(
            ArcoCancellationRequestDTO request
    ) {
        return arcoRestClient.post()
                .uri("/api/arco-requests/cancellation")
                .body(request)
                .retrieve()
                .body(ArcoRequestResponseDTO.class);
    }

    public ArcoRequestResponseDTO ejecutarCancelacion(UUID solicitudId) {
        return arcoRestClient.post()
                .uri("/api/arco-requests/cancellation/" + solicitudId + "/execute")
                .retrieve()
                .body(ArcoRequestResponseDTO.class);
    }
}
