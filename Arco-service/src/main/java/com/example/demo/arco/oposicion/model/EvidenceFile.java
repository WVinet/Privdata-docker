package com.example.demo.arco.oposicion.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "evidence_file")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EvidenceFile {

    @Id
    @GeneratedValue
    private UUID id;

    // UUID plano para reutilizabilidad entre tipos ARCO
    @Column(name = "opposition_request_id", nullable = false)
    private UUID oppositionRequestId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type")
    private String fileType;

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    // Referencia futura a almacenamiento externo — sin almacenamiento físico aún
    @Column(name = "storage_reference")
    private String storageReference;

    @Column(name = "uploaded_by_user_id")
    private UUID uploadedByUserId;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
