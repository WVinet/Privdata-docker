package com.example.demo.arco.opposition.dto.request;

import com.example.demo.arco.opposition.enums.ClaimCausal;
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
