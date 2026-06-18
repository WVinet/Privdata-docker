package com.example.demo.arsop.solicitudesAdicionales.bloqueo.dto;

import com.example.demo.arsop.solicitudesAdicionales.bloqueo.enums.BlockingCause;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import lombok.Data;

@Data
public class CreateBlockingDTO {

    private ArcoRequestCreateDTO arcoRequest;

    private BlockingCause cause;

    private String reason;
}