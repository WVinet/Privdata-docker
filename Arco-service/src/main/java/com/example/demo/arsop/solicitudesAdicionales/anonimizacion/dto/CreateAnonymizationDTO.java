package com.example.demo.arsop.solicitudesAdicionales.anonimizacion.dto;

import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.enums.AnonymizationCause;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import lombok.Data;

@Data
public class CreateAnonymizationDTO {

    private ArcoRequestCreateDTO arcoRequest;

    private AnonymizationCause cause;

    private String reason;
}