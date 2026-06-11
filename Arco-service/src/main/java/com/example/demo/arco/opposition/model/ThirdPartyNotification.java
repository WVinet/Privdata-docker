package com.example.demo.arco.opposition.model;

import com.example.demo.arco.opposition.enums.ThirdPartyNotificationStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "third_party_notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ThirdPartyNotification {

    @Id
    @GeneratedValue
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opposition_request_id", nullable = false)
    private OppositionRequest oppositionRequest;

    @Column(name = "third_party_name", nullable = false)
    private String thirdPartyName;

    @Column(name = "third_party_email")
    private String thirdPartyEmail;

    @Column(name = "notification_reason", nullable = false, columnDefinition = "TEXT")
    private String notificationReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ThirdPartyNotificationStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
