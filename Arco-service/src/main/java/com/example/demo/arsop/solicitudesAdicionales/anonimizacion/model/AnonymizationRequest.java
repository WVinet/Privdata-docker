package com.example.demo.arsop.solicitudesAdicionales.anonimizacion.model;

import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.enums.AnonymizationCause;
import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.enums.AnonymizationDecision;
import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.enums.AnonymizationStatus;
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
public class AnonymizationRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne
    @JoinColumn(name = "arco_request_id")
    private ArcoRequest arcoRequest;

    @Enumerated(EnumType.STRING)
    private AnonymizationCause cause;

    @Enumerated(EnumType.STRING)
    private AnonymizationStatus anonymizationStatus;

    @Enumerated(EnumType.STRING)
    private AnonymizationDecision decision;

    @Column(columnDefinition = "TEXT")
    private String reason;

    private Boolean legalObligationApplies;

    private Boolean identificationStillRequired;

    private Boolean technicalImpossibility;

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