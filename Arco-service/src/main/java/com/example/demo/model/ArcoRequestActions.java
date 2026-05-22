package com.example.demo.model;

import com.example.demo.enums.arcoRequestAction.ArcoActionType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ArcoRequestActions {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "executed_by_user_id", nullable = true)
    private UUID executedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ArcoActionType actionType;

    @Column(name = "result_summary", nullable = true, columnDefinition = "TEXT")
    private String resultSummary;

    @Column(name = "artifact_url", nullable = true, length = 500)
    private String artifactUrl;

    @CreationTimestamp
    @Column(name = "executed_at", nullable = false, updatable = false)
    private LocalDateTime executedAt;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "arco_request_id", nullable = false)
    private ArcoRequest arcoRequest;
}
