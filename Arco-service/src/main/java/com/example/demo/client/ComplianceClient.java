package com.example.demo.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComplianceClient {

    private final RestClient restClient;

    @Value("${service.compliance.url:http://localhost:8083}")
    private String complianceUrl;

    // Art. 8° Ley 21.719: verifica si el tratamiento está exento de oposición
    // por ser de investigación científica, estadística o histórica vinculada a función pública
    public boolean isExemptFromOpposition(UUID treatmentActivityId) {
        try {
            Boolean result = restClient.get()
                    .uri(complianceUrl + "/api/treatment-activities/{id}/exempt-from-opposition", treatmentActivityId)
                    .retrieve()
                    .body(Boolean.class);
            return Boolean.TRUE.equals(result);
        } catch (RestClientException e) {
            log.warn("No se pudo consultar la exención de oposición al Compliance-service para treatmentActivityId={}: {}",
                    treatmentActivityId, e.getMessage());
            return false;
        }
    }

    // Art. 8° Ley 21.719: obtiene cesionarios registrados para el titular y tratamiento
    // Necesario para el subflujo de notificación a terceros (4.5)
    @SuppressWarnings("unchecked")
    public List<String> getCesionarios(UUID dataSubjectId, UUID treatmentActivityId) {
        if (treatmentActivityId == null) {
            return Collections.emptyList();
        }
        try {
            List<String> result = restClient.get()
                    .uri(complianceUrl + "/api/treatment-activities/{treatmentId}/cesionarios?dataSubjectId={subjectId}",
                            treatmentActivityId, dataSubjectId)
                    .retrieve()
                    .body(List.class);
            return result != null ? result : Collections.emptyList();
        } catch (RestClientException e) {
            log.warn("No se pudo obtener cesionarios del Compliance-service: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
