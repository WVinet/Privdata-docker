package com.example.demo.arco.supresion;

import com.example.demo.arco.supresion.enums.SuppressionStatus;
import com.example.demo.arco.supresion.model.SuppressionRequest;

import com.example.demo.model.ArcoRequest;

import org.springframework.stereotype.Component;

@Component
public class SuppressionFactory {

    public SuppressionRequest create(
            ArcoRequest request,
            String reason
    ) {

        return SuppressionRequest.builder()
                .arcoRequest(request)
                .suppressionStatus(
                        SuppressionStatus.IDENTIDAD_PENDIENTE
                )
                .reason(reason)
                .build();
    }
}
