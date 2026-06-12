package com.example.demo.dto.response;

import lombok.Data;

import java.util.UUID;

@Data
public class PersonResponseDTO {
    private Boolean success;
    private String message;
    private PersonData data;

    @Data
    public static class PersonData {
        private UUID id;
        private String email;
        private String fullName;
    }
}
