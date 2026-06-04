package com.example.demo.dto.request;

import com.example.demo.enums.arcoRequest.ArcoRequestChannel;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateArcoRequestDTO {
    private UUID organizationId;
    private UUID dataSubjectId;
    private UUID assignedToUserId;
    private ArcoRequestType requestType;
    private ArcoRequestChannel requestChannel;
    private String description;
}
