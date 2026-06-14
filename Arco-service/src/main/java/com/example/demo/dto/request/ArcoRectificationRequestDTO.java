package com.example.demo.dto.request;

import lombok.Data;

import java.util.UUID;

@Data
public class ArcoRectificationRequestDTO {
    private UUID organizationId;
    private UUID dataSubjectId;
    private UUID assignedToUserId;
    private String description;
    private String firstName;
    private String lastName;
    private String rut;
    private String email;
    private String phone;
    private String position;
}
