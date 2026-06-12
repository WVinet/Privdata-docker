package com.privdata.bff_api.dtos.response.arco;


import com.privdata.bff_api.enums.ArcoIdentityVerificationStatus;
import com.privdata.bff_api.enums.ArcoRequestChannel;
import com.privdata.bff_api.enums.ArcoRequestType;
import com.privdata.bff_api.enums.ArcoStatus;
import lombok.Data;


import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ArcoRequestResponseDTO {

    private UUID id;
    private UUID organizationId;
    private UUID dataSubjectId;
    private UUID assignedToUserId;
    private ArcoRequestType requestType;
    private ArcoRequestChannel requestChannel;
    private ArcoStatus status;
    private ArcoIdentityVerificationStatus identityVerificationStatus;
    private String description;
    private String resolutionSummary;
    private LocalDateTime submittedAt;
    private LocalDateTime dueAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;


}
