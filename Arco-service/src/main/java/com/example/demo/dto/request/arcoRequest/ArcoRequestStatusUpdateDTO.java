package com.example.demo.dto.request.arcoRequest;

import com.example.demo.enums.arcoRequest.ArcoStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArcoRequestStatusUpdateDTO {

    @NotNull
    private ArcoStatus newStatus;

    private UUID changedByUserId;

    private String comment;

    private String denialLegalBasis;
}
