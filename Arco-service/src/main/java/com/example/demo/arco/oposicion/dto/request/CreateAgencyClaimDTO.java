package com.example.demo.arco.oposicion.dto.request;

import com.example.demo.arco.oposicion.enums.ClaimCausal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateAgencyClaimDTO {

    private ClaimCausal claimCausal;
    private String impugnedDecision;
    private String supportingDocuments;
    private String notificationChannel;
}
