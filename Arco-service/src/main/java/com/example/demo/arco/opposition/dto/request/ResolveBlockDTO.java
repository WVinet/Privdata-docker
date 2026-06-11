package com.example.demo.arco.opposition.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResolveBlockDTO {

    private boolean approved;

    // Art. 11: obligatorio si approved = false (rechazo debe ser fundado)
    private String grounds;
}
