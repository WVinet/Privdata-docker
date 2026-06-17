package com.example.demo.arco.rectificacion.dto;

import com.example.demo.dto.request.PersonRectificationRequestDTO;
import lombok.Data;

@Data
public class CreateRectificationRequestDTO {

    private String justification;

    private PersonRectificationRequestDTO
            requestedData;
}
