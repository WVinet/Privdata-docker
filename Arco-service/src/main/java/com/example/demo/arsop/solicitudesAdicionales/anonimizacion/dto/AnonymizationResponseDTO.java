package com.example.demo.arsop.solicitudesAdicionales.anonimizacion.dto;

import lombok.Data;

@Data
public class AnonymizationResponseDTO {

    private Boolean approved;

    private String observations;

    private String rejectionReason;

    private Boolean legalObligationApplies;

    private Boolean identificationStillRequired;

    private Boolean technicalImpossibility;

    private Boolean exceptionApplies;
}