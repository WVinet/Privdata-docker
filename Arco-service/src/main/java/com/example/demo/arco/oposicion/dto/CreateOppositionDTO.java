package com.example.demo.arco.oposicion.dto;

import com.example.demo.arco.oposicion.enums.OppositionCause;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import lombok.Data;

@Data
public class CreateOppositionDTO {

    private ArcoRequestCreateDTO arcoRequest;

    private OppositionCause cause;

    private String reason;

    private String processingPurpose;

    private String opposedTreatment;
}