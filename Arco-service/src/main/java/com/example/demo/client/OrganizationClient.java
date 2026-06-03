package com.example.demo.client;

import com.example.demo.dto.response.OrgResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrganizationClient {

    private final RestClient orgClient;

    @Value("${services.organization.url}")
    private String organizationServiceUrl;

    public OrgResponseDTO findByid(UUID id){
        return orgClient
                .get()
                .uri(organizationServiceUrl+"/api/organizations/{organizationId}" + id)
                .retrieve()
                .body(OrgResponseDTO.class);
    }

    public void blockDataSubject(UUID organizationId, UUID dataSubjectId) {

        orgClient.post()
                .uri(organizationServiceUrl +
                        "/api/organizations/" +
                        organizationId +
                        "/data-subjects/" +
                        dataSubjectId +
                        "/block")
                .retrieve()
                .toBodilessEntity();
    }

    public void deleteDataSubject(UUID organizationId, UUID dataSubjectId) {

        orgClient.post()
                .uri(organizationServiceUrl +
                        "/api/organizations/" +
                        organizationId +
                        "/data-subjects/" +
                        dataSubjectId +
                        "/delete")
                .retrieve()
                .toBodilessEntity();
    }

    public void anonymizeDataSubject(UUID organizationId, UUID dataSubjectId) {

        orgClient.post()
                .uri(organizationServiceUrl +
                        "/api/organizations/" +
                        organizationId +
                        "/data-subjects/" +
                        dataSubjectId +
                        "/anonymize")
                .retrieve()
                .toBodilessEntity();
    }

}
