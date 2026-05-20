package com.example.demo.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoRequestChannel;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.enums.arcoRequest.ArcoStatus;

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


    @Column(name="organization_id", nullable = false)
    private UUID organizationId;
    @Column(name="data_subject_id", nullable = false)
    private UUID dataSubjectId;
  
    @Column(name ="assigned_to_user_id" , nullable = false)
    private UUID assignedToUserId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false)
    private ArcoRequestType requestType; //pasar a enum, LISTO
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ArcoStatus status; //pasar a enum, Listo
    
    @Column(name = "identity_verification_status", nullable = false) 
    private ArcoIdentityVerificationStatus identityVerificationStatus;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "request_channel", nullable = false)
    private ArcoRequestChannel requestChannel;
    
    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;
    
    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;
    
    @Column(name = "description", nullable = false)
    private String description;
    
    @Column(name = "resolution_summary", nullable = true)
    private String resolutionSummary;
    
    @Column(name = "resolved_at", nullable = true)
    private LocalDateTime resolvedAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    //relaciones
    @OneToMany(mappedBy = "arcoRequest")
    private List<ArcoRequestEvidences> evidences;

    @OneToMany(mappedBy = "arcoRequest")
    private List<ArcoRequestActions> actions;

    @OneToMany(mappedBy = "arcoRequest")
    private List<ArcoRequestStatusHistory> statusHistory;


}
