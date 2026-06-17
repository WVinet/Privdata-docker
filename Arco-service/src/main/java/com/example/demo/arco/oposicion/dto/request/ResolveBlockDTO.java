package com.example.demo.arco.oposicion.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResolveBlockDTO {

    private boolean approved;

    // Art. 11: obligatorio si approved = false (rechazo debe ser fundado)
    private String grounds;
}
