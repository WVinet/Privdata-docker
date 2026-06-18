package com.example.demo.arsop.portabilidad.dto;

import lombok.Data;

@Data
public class PortabilityResponseDTO {
    private Boolean approved;

    private String observations;

    private String rejectionReason;
}