package com.example.demo.model;

import java.time.LocalDateTime;
import java.util.UUID;

import com.example.demo.enums.arcoRequestStatusHistory.ArcoHistoryStatus;
import jakarta.persistence.*;
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
public class ArcoRequestStatusHistory {
    @Id
    @GeneratedValue
    private UUID id;

//    @Column(name = "arco_request_id", nullable = false)
//    private UUID arcoRequestId;

    @Column(name = "change_by_user_id", nullable = false)
    private UUID changeByUserId;

    //ambos enums usan el mismo enum
    @Column(name="previous_status",nullable= false) //enum
    private ArcoHistoryStatus previousStatus;

    @Column(name="new_status",nullable= false) //enum
    private ArcoHistoryStatus newStatus;

    @UpdateTimestamp
    @Column(name="change_at",nullable= false)
    private LocalDateTime changeAt;

    @Column(name="comment",nullable= false)
    private String comment;

    @ManyToOne
    @JoinColumn(name = "arco_request_id", nullable = false)
    private ArcoRequest arcoRequest;
}
