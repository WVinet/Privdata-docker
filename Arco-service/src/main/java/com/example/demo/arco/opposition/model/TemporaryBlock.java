package com.example.demo.arco.opposition.model;

import com.example.demo.arco.opposition.enums.BlockStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "temporary_block")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TemporaryBlock {

    @Id
    @GeneratedValue
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opposition_request_id", nullable = false)
    private OppositionRequest oppositionRequest;

    @Column(name = "justification", nullable = false, columnDefinition = "TEXT")
    private String justification;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private BlockStatus status;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    // Art. 11: plazo de 2 días hábiles para responder al bloqueo
    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolution_grounds", columnDefinition = "TEXT")
    private String resolutionGrounds;

    // Art. 11: si rechazado, el responsable debe notificar electrónicamente a la Agencia
    @Column(name = "rejected_notified_agency", nullable = false)
    private boolean rejectedNotifiedAgency = false;

    @Column(name = "rejected_notified_at")
    private LocalDateTime rejectedNotifiedAt;

    @Column(name = "resolved_by_user_id")
    private UUID resolvedByUserId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
