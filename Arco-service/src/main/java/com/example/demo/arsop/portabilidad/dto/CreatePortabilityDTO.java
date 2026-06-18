package com.example.demo.arsop.portabilidad.dto;

import com.example.demo.arsop.portabilidad.enums.PortabilityCause;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import lombok.Data;

@Data
public class CreatePortabilityDTO {

    private ArcoRequestCreateDTO arcoRequest;

    private PortabilityCause cause;

    private String destinationOrganization;

    private String reason;
}