package com.example.demo.dto.arcoRequestAction;

import com.example.demo.enums.arcoRequestAction.ArcoActionType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArcoRequestActionCreateDTO {

    private UUID executedByUserId;

    @NotNull
    private ArcoActionType actionType;

    private String resultSummary;

    private String artifactUrl;
}
