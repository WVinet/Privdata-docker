package com.example.demo.arsop.rectificacion.model;

import com.example.demo.arsop.rectificacion.enums.RectificationStatus;
import com.example.demo.model.ArcoRequest;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RectificationRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne
    @JoinColumn(name = "arco_request_id", nullable = false, unique = true)
    private ArcoRequest arcoRequest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RectificationStatus rectificationStatus;

    @Column(columnDefinition = "TEXT")
    private String justification;

    private String firstName;
    private String lastName;
    private String rut;
    private String email;
    private String phone;
    private String position;

    @Column(columnDefinition = "TEXT")
    private String responseSummary;
}