package com.example.demo.arco.oposicion.dto.request;

import com.example.demo.arco.oposicion.enums.ThirdPartyNotificationStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateThirdPartyNotificationDTO {

    // Valores válidos: SENT, CONFIRMED, FAILED
    private ThirdPartyNotificationStatus status;
}
