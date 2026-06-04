package com.example.demo.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.example.demo.enums.arcoRequest.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
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
public class ArcoRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "data_subject_id", nullable = false)
    private UUID dataSubjectId;
  
    @Column(name ="assigned_to_user_id", nullable = true)
    private UUID assignedToUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false)
    private ArcoRequestType requestType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ArcoStatus status; //pasar a enum, Listo
    
    @Enumerated(EnumType.STRING)
    @Column(name = "identity_verification_status", nullable = false)
    private ArcoIdentityVerificationStatus identityVerificationStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_channel", nullable = false)
    private ArcoRequestChannel requestChannel;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_channel", nullable = false)
    private ArcoCancellationType cancellationActionType;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "resolution_summary", nullable = true, columnDefinition = "TEXT")
    private String resolutionSummary;

    @Column(name = "resolved_at", nullable = true)
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @JsonIgnore
    @OneToMany(mappedBy = "arcoRequest", cascade = CascadeType.ALL)
    private List<ArcoRequestEvidences> evidences;

    @JsonIgnore
    @OneToMany(mappedBy = "arcoRequest", cascade = CascadeType.ALL)
    private List<ArcoRequestActions> actions;

    @JsonIgnore
    @OneToMany(mappedBy = "arcoRequest", cascade = CascadeType.ALL)
    private List<ArcoRequestStatusHistory> statusHistory;
}
