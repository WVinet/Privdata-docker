package com.example.demo.model;

import com.example.demo.enums.arcoRequestAction.ArcoActionType;
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

//    @Column(name = "arco_request_id", nullable = false)
//    private UUID arcoRequestId;
    @Column(name = "executed_by_user_id", nullable = false)
    private UUID executedByUserId;
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ArcoActionType actionType;
    @Column(name = "result_summary", nullable = false)
    private String resultSummary;
    @Column(name = "artifact_url", nullable = false)
    private String artifactUrl;
    @CreationTimestamp
    @Column(name = "executed_at", nullable = false)
    private LocalDateTime executedAt;

    @ManyToOne
    @JoinColumn(name = "arco_request_id", nullable = false)
    private ArcoRequest arcoRequest;
}
