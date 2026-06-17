package com.example.demo.arco.oposicion.dto.request;

import com.example.demo.arco.oposicion.enums.OppositionStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResolveOppositionDTO {

    // Valores válidos: ACCEPTED, PARTIALLY_ACCEPTED, REJECTED
    private OppositionStatus decision;

    // Art. 11: obligatorio si decision = REJECTED o PARTIALLY_ACCEPTED
    private String grounds;
}
