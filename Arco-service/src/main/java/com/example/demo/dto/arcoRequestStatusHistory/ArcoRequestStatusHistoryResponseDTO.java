package com.example.demo.dto.arcoRequestStatusHistory;

import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.model.ArcoRequestStatusHistory;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArcoRequestStatusHistoryResponseDTO {

    private UUID id;
    private UUID arcoRequestId;
    private ArcoStatus previousStatus;
    private ArcoStatus newStatus;
    private UUID changedByUserId;
    private LocalDateTime changedAt;
    private String comment;

    public static ArcoRequestStatusHistoryResponseDTO fromEntity(ArcoRequestStatusHistory e) {
        return new ArcoRequestStatusHistoryResponseDTO(
                e.getId(),
                e.getArcoRequest().getId(),
                e.getPreviousStatus(),
                e.getNewStatus(),
                e.getChangedByUserId(),
                e.getChangedAt(),
                e.getComment()
        );
    }
}
