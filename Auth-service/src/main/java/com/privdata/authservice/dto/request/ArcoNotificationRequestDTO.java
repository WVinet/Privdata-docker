package com.privdata.authservice.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ArcoNotificationRequestDTO {
    private String email;
    private String requestTypeLabel;
    private String statusLabel;
    private String resolutionSummary;
    private String denialLegalBasis;
}
