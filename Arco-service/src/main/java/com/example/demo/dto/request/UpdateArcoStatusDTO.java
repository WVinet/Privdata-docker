package com.example.demo.dto.request;

import com.example.demo.enums.arcoRequest.ArcoStatus;
import lombok.Data;

@Data
public class UpdateArcoStatusDTO {
    private ArcoStatus status;
    private String resolutionSummary;
}
