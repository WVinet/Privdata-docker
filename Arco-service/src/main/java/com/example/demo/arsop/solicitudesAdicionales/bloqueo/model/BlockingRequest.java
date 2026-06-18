package com.example.demo.arsop.solicitudesAdicionales.bloqueo.model;

import com.example.demo.arsop.solicitudesAdicionales.bloqueo.enums.BlockingCause;
import com.example.demo.arsop.solicitudesAdicionales.bloqueo.enums.BlockingDecision;
import com.example.demo.arsop.solicitudesAdicionales.bloqueo.enums.BlockingStatus;
import com.example.demo.model.ArcoRequest;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockingRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne
    @JoinColumn(name = "arco_request_id")
    private ArcoRequest arcoRequest;

    @Enumerated(EnumType.STRING)
    private BlockingCause cause;

    @Enumerated(EnumType.STRING)
    private BlockingStatus blockingStatus;

    @Enumerated(EnumType.STRING)
    private BlockingDecision decision;

    @Column(columnDefinition = "TEXT")
    private String reason;

    private Boolean legalObligationApplies;

    private Boolean exceptionApplies;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(columnDefinition = "TEXT")
    private String responseSummary;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}