package com.example.demo.arsop.oposicion.dto;

import lombok.Data;

@Data
public class OppositionResponseDTO {

    private Boolean approved;

    private String observations;

    private String rejectionReason;

    private Boolean overridingLegitimateGrounds;

    private Boolean legalObligationApplies;

    private Boolean publicInterestApplies;

    private Boolean exceptionApplies;

    private Boolean blockInsteadOfRestrict;
}