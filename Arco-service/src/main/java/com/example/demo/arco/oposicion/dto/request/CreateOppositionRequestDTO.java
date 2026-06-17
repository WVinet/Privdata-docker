package com.example.demo.arco.oposicion.dto.request;

import com.example.demo.arco.oposicion.enums.OppositionCausal;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateOppositionRequestDTO {

    // dataSubjectId: del JWT si el titular actúa directamente; del body si lo registra un analista
    private UUID dataSubjectId;
    private UUID treatmentActivityId;

    private String requesterName;
    private String requesterRut;
    private String requesterEmail;
    private String contactAddress;

    private String representativeName;
    private String representativeRut;

    private OppositionCausal causal;

    // Art. 8° a): obligatorio si causal = INTERES_LEGITIMO
    private String justification;

    private String opposedTreatment;

    // Art. 23: flag para organismos públicos
    private boolean publicEntity;
}
