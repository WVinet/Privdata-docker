package com.example.demo.dto.arcoRequestEvidence;

import com.example.demo.enums.arcoRequestEvidence.ArcoEvidenceType;
import com.example.demo.enums.arcoRequestEvidence.ArcoFileType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArcoRequestEvidenceCreateDTO {

    private UUID uploadedByUserId;

    @NotNull
    private ArcoEvidenceType evidenceType;

    @NotBlank
    private String fileName;

    @NotBlank
    private String fileUrl;

    @NotNull
    private ArcoFileType fileType;

    private String notes;
}
