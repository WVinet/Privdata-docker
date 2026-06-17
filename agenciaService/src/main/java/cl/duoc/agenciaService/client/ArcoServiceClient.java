package cl.duoc.agenciaService.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ArcoServiceClient {

    private final RestClient restClient;

    @Value("${services.arco.url}")
    private String arcoServiceUrl;

    public void notificarRespuesta(UUID arcoRequestId, UUID agencyClaimId, String response, LocalDateTime respondedAt) {
        Map<String, Object> body = new HashMap<>();
        body.put("agencyClaimId", agencyClaimId);
        body.put("response", response);
        body.put("respondedAt", respondedAt);

        restClient.patch()
                .uri(arcoServiceUrl + "/api/arco-request/" + arcoRequestId + "/respuesta-agencia")
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }

    public Object listarSolicitudes(UUID organizationId) {
        String uri = arcoServiceUrl + "/api/arco-request"
                + (organizationId != null ? "?organizationId=" + organizationId : "");
        return restClient.get()
                .uri(uri)
                .retrieve()
                .body(Object.class);
    }
}
