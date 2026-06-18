package com.example.demo.arco.portabilidad.model;

import com.example.demo.arco.portabilidad.enums.PortabilityCause;
import com.example.demo.arco.portabilidad.enums.PortabilityDecision;
import com.example.demo.arco.portabilidad.enums.PortabilityStatus;
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
public class PortabilityRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne
    @JoinColumn(name = "arco_request_id")
    private ArcoRequest arcoRequest;

    @Enumerated(EnumType.STRING)
    private PortabilityCause cause;

    @Enumerated(EnumType.STRING)
    private PortabilityStatus portabilityStatus;

    @Enumerated(EnumType.STRING)
    private PortabilityDecision decision;

    private String destinationOrganization;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String responseSummary;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    private String generatedFileName;

    private String generatedFilePath;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}