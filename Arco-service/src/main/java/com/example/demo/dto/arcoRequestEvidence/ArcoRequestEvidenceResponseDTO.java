package com.example.demo.dto.arcoRequestEvidence;

import com.example.demo.enums.arcoRequestEvidence.ArcoEvidenceType;
import com.example.demo.enums.arcoRequestEvidence.ArcoFileType;
import com.example.demo.model.ArcoRequestEvidences;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArcoRequestEvidenceResponseDTO {

    private UUID id;
    private UUID arcoRequestId;
    private UUID uploadedByUserId;
    private ArcoEvidenceType evidenceType;
    private String fileName;
    private String fileUrl;
    private ArcoFileType fileType;
    private String notes;
    private LocalDateTime uploadedAt;

    public static ArcoRequestEvidenceResponseDTO fromEntity(ArcoRequestEvidences e) {
        return new ArcoRequestEvidenceResponseDTO(
                e.getId(),
                e.getArcoRequest().getId(),
                e.getUploadedByUserId(),
                e.getEvidenceType(),
                e.getFileName(),
                e.getFileUrl(),
                e.getFileType(),
                e.getNotes(),
                e.getUploadedAt()
        );
    }
}
