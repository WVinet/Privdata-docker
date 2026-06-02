package com.example.demo.dto.arcoRequestAction;

import com.example.demo.enums.arcoRequestAction.ArcoActionType;
import com.example.demo.model.ArcoRequestActions;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArcoRequestActionResponseDTO {

    private UUID id;
    private UUID arcoRequestId;
    private UUID executedByUserId;
    private ArcoActionType actionType;
    private String resultSummary;
    private String artifactUrl;
    private LocalDateTime executedAt;

    public static ArcoRequestActionResponseDTO fromEntity(ArcoRequestActions e) {
        return new ArcoRequestActionResponseDTO(
                e.getId(),
                e.getArcoRequest().getId(),
                e.getExecutedByUserId(),
                e.getActionType(),
                e.getResultSummary(),
                e.getArtifactUrl(),
                e.getExecutedAt()
        );
    }
}
