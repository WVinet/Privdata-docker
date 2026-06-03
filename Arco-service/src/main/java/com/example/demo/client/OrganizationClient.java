package com.example.demo.client;

import com.example.demo.dto.response.OrgResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrganizationClient {

    private final RestClient orgClient;

    public OrgResponseDTO findByid(UUID id){
        return orgClient
                .get()
                .uri("/api/organizations/{organizationId}" + id)
                .retrieve()
                .body(OrgResponseDTO.class);
    }

}
