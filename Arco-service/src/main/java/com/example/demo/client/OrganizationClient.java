package com.example.demo.client;

import com.example.demo.dto.request.PersonRectificationRequestDTO;
import com.example.demo.dto.response.OrgResponseDTO;
import com.example.demo.dto.response.PersonResponseDTO;
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

    public OrgResponseDTO findById(UUID id) {
        return orgClient
                .get()
                .uri(organizationServiceUrl + "/api/organizations/" + id)
                .retrieve()
                .body(OrgResponseDTO.class);
    }

    public PersonResponseDTO findPersonById(UUID organizationId, UUID personId) {
        return orgClient.get()
                .uri(organizationServiceUrl
                        + "/api/organizations/" + organizationId
                        + "/persons/" + personId)
                .retrieve()
                .body(PersonResponseDTO.class);
    }

    public void blockDataSubject(UUID organizationId, UUID dataSubjectId) {
        orgClient.post()
                .uri(organizationServiceUrl
                        + "/api/organizations/" + organizationId
                        + "/persons/" + dataSubjectId
                        + "/block")
                .retrieve()
                .toBodilessEntity();
    }

    public void deleteDataSubject(UUID organizationId, UUID dataSubjectId) {
        orgClient.post()
                .uri(organizationServiceUrl
                        + "/api/organizations/" + organizationId
                        + "/persons/" + dataSubjectId
                        + "/delete")
                .retrieve()
                .toBodilessEntity();
    }

    public void anonymizeDataSubject(UUID organizationId, UUID dataSubjectId) {
        orgClient.post()
                .uri(organizationServiceUrl
                        + "/api/organizations/" + organizationId
                        + "/persons/" + dataSubjectId
                        + "/anonymize")
                .retrieve()
                .toBodilessEntity();
    }

    ///rectificaion
    public void  rectificationDataSubject(UUID organizationId,
                                          UUID personId,
                                          PersonRectificationRequestDTO requestDTO){
         orgClient.post()
                .uri(organizationServiceUrl
                        + "/api/organizations/" + organizationId
                        + "/persons/" + personId + "/rectify")
                .body(requestDTO)
                .retrieve()
                .toBodilessEntity();

    }

    ///acceso
//    public AccessDataResponseDTO getAccessData(UUID organizationId, UUID personId) {
//        return orgClient.get()
//                .uri(organizationServiceUrl
//                        + "/api/organizations/" + organizationId
//                        + "/persons/" + personId
//                        + "/access-data")
//                .retrieve()
//                .body(AccessDataResponseDTO.class);
//    }
}