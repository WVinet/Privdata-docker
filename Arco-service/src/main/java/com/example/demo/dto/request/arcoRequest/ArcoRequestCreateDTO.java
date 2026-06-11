package com.example.demo.dto.request.arcoRequest;

import com.example.demo.enums.arcoRequest.ArcoRequestChannel;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArcoRequestCreateDTO {

    @NotNull
    private UUID organizationId;

    @NotNull
    private UUID dataSubjectId;

    private UUID assignedToUserId;

    @NotNull
    private ArcoRequestType requestType;

    @NotNull
    private ArcoRequestChannel requestChannel;

    @NotBlank
    private String description;
}
