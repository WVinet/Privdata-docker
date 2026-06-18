package com.example.demo.arsop.solicitudesAdicionales.bloqueo.dto;

import lombok.Data;

@Data
public class BlockingResponseDTO {

    private Boolean approved;

    private String observations;

    private String rejectionReason;

    private Boolean legalObligationApplies;

    private Boolean exceptionApplies;
}