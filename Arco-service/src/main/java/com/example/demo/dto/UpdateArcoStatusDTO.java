package com.example.demo.dto;

import com.example.demo.enums.arcoRequest.ArcoStatus;
import lombok.Data;

@Data
public class UpdateArcoStatusDTO {
    private ArcoStatus status;
    private String resolutionSummary;
}
