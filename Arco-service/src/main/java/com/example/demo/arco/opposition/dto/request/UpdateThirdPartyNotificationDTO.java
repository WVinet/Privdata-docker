package com.example.demo.arco.opposition.dto.request;

import com.example.demo.arco.opposition.enums.ThirdPartyNotificationStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateThirdPartyNotificationDTO {

    // Valores válidos: SENT, CONFIRMED, FAILED
    private ThirdPartyNotificationStatus status;
}
