package com.example.demo.arsop.oposicion.dto;

import com.example.demo.arsop.oposicion.enums.OppositionCause;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateOppositionDTO {

    private ArcoRequestCreateDTO arcoRequest;

    private OppositionCause cause;

    private String reason;

    private String processingPurpose;

    private String opposedTreatment;

    private UUID treatmentActivityId;
}