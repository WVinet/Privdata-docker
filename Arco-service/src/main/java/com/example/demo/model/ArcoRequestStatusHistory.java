package com.example.demo.model;

import java.time.LocalDateTime;
import java.util.UUID;

import com.example.demo.enums.arcoRequest.ArcoStatus;
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
public class ArcoRequestStatusHistory {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "changed_by_user_id", nullable = true)
    private UUID changedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", nullable = false)
    private ArcoStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false)
    private ArcoStatus newStatus;

    @CreationTimestamp
    @Column(name = "changed_at", nullable = false, updatable = false)
    private LocalDateTime changedAt;

    @Column(name = "comment", nullable = true, columnDefinition = "TEXT")
    private String comment;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "arco_request_id", nullable = false)
    private ArcoRequest arcoRequest;
}
