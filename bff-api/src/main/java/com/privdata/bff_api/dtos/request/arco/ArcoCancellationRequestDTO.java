package com.privdata.bff_api.dtos.request.arco;

import com.example.demo.enums.arcoRequest.ArcoCancellationType;
import lombok.Data;

import java.util.UUID;

@Data
public class ArcoCancellationRequestDTO {

    private UUID organizationId;
    private UUID dataSubjectId;
    private UUID assignedToUserId;
    private String requestChannel;
    private String description;
    private ArcoCancellationType cancellationActionType;
}
