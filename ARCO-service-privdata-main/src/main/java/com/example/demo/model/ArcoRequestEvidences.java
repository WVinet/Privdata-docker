package com.example.demo.model;

import java.time.LocalDateTime;
import java.util.UUID;

import com.example.demo.enums.arcoRequestEvidence.ArcoEvidenceType;
import com.example.demo.enums.arcoRequestEvidence.ArcoFileType;
import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ArcoRequestEvidences {
    @Id
    @GeneratedValue
    private UUID id;
    
//    @Column(name = "arco_request_id", nullable = false)
//    private UUID arcoRequestId;
    
    @Column(name = "uploaded_by_user_id", nullable = false)
    private UUID uploadedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_type", nullable = false) 
    private ArcoEvidenceType evidenceType;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false) 
    private ArcoFileType fileType;

    @Column(name = "notas", nullable = false)
    private String notes;

    @UpdateTimestamp
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    //relaciones
    @ManyToOne
    @JoinColumn(name = "arco_request_id", nullable = false)
    private ArcoRequest arcoRequest;
}
