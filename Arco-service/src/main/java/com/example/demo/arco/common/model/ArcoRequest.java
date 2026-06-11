package com.example.demo.arco.common.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public abstract class ArcoRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "data_subject_id", nullable = false)
    private UUID dataSubjectId;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    // Art. 11 Ley 21.719: plazo de 30 días corridos desde la recepción
    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;

    // Art. 11: prórroga única de 30 días corridos adicionales
    @Column(name = "extension_date")
    private LocalDateTime extensionDate;

    @Column(name = "extended", nullable = false)
    private boolean extended = false;

    @Column(name = "extended_at")
    private LocalDateTime extendedAt;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    // Art. 11: el rechazo siempre debe tener fundamento legal
    @Column(name = "resolution_grounds", columnDefinition = "TEXT")
    private String resolutionGrounds;

    @Column(name = "resolved_by_user_id")
    private UUID resolvedByUserId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
