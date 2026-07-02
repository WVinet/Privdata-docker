package com.example.demo.client;

import com.example.demo.dto.response.AgencyClaimResponseDTO;
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
public class AgenciaClient {

    private final RestClient restClient;

    @Value("${services.agencia.url}")
    private String agenciaServiceUrl;

    public AgencyClaimResponseDTO crearReclamo(UUID arcoRequestId,
                                                UUID organizationId,
                                                String organizationName,
                                                String organizationEmail,
                                                UUID dataSubjectId,
                                                String dataSubjectName,
                                                String dataSubjectEmail,
                                                String requestType,
                                                String originalResolutionSummary,
                                                String originalDenialLegalBasis,
                                                String originalResolvedByEmail,
                                                String claimReason,
                                                LocalDateTime submittedAt) {
        Map<String, Object> body = new HashMap<>();
        body.put("arcoRequestId", arcoRequestId);
        body.put("organizationId", organizationId);
        body.put("organizationName", organizationName);
        body.put("organizationEmail", organizationEmail);
        body.put("dataSubjectId", dataSubjectId);
        body.put("dataSubjectName", dataSubjectName);
        body.put("dataSubjectEmail", dataSubjectEmail);
        body.put("requestType", requestType);
        body.put("originalResolutionSummary", originalResolutionSummary);
        body.put("originalDenialLegalBasis", originalDenialLegalBasis);
        body.put("originalResolvedByEmail", originalResolvedByEmail);
        body.put("claimReason", claimReason);
        body.put("submittedAt", submittedAt);

        return restClient.post()
                .uri(agenciaServiceUrl + "/api/agency-claims")
                .body(body)
                .retrieve()
                .body(AgencyClaimResponseDTO.class);
    }
}
