package com.example.demo.model;

import java.time.LocalDateTime;
import java.util.UUID;

import com.example.demo.enums.arcoRequestEvidence.ArcoEvidenceType;
import com.example.demo.enums.arcoRequestEvidence.ArcoFileType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

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

    @Column(name = "uploaded_by_user_id", nullable = true)
    private UUID uploadedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_type", nullable = false)
    private ArcoEvidenceType evidenceType;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "file_type", nullable = false, length = 100)
    private ArcoFileType fileType;

    @Column(name = "notes", nullable = true, columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "arco_request_id", nullable = false)
    private ArcoRequest arcoRequest;
}
