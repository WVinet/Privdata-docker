package com.example.demo.arsop.acceso.model;

import com.example.demo.arsop.acceso.enums.AccessStatus;
import com.example.demo.model.ArcoRequest;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne
    @JoinColumn(name = "arco_request_id", nullable = false, unique = true)
    private ArcoRequest arcoRequest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccessStatus accessStatus;

    @Column(columnDefinition = "TEXT")
    private String requestedInformation;

    @Column(columnDefinition = "TEXT")
    private String responseSummary;

    @Column(columnDefinition = "TEXT")
    private String personalDataFound;

    @Column(columnDefinition = "TEXT")
    private String purposes;

    @Column(columnDefinition = "TEXT")
    private String dataOrigin;

    @Column(columnDefinition = "TEXT")
    private String recipients;

    @Column(columnDefinition = "TEXT")
    private String retentionPeriod;

    @Column(columnDefinition = "TEXT")
    private String legalBasis;

    @Column(columnDefinition = "TEXT")
    private String automatedDecisionInfo;

    private Boolean dataFound;

    private LocalDateTime respondedAt;

    private LocalDateTime closedAt;
}