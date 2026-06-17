package com.example.demo.dto.response;

import lombok.Data;

import java.util.UUID;

@Data
public class AgencyClaimResponseDTO {
    private Boolean success;
    private String message;
    private AgencyClaimData data;

    @Data
    public static class AgencyClaimData {
        private UUID id;
        private UUID arcoRequestId;
        private String status;
    }
}
