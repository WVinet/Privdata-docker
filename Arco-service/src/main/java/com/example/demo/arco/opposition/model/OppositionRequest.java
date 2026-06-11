package com.example.demo.arco.opposition.model;

import com.example.demo.arco.common.model.ArcoRequest;
import com.example.demo.arco.opposition.enums.OppositionCausal;
import com.example.demo.arco.opposition.enums.OppositionStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "opposition_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OppositionRequest extends ArcoRequest {

    @Column(name = "treatment_activity_id")
    private UUID treatmentActivityId;

    @Column(name = "requester_name", nullable = false)
    private String requesterName;

    @Column(name = "requester_rut", nullable = false)
    private String requesterRut;

    @Column(name = "requester_email", nullable = false)
    private String requesterEmail;

    @Column(name = "contact_address")
    private String contactAddress;

    @Column(name = "representative_name")
    private String representativeName;

    @Column(name = "representative_rut")
    private String representativeRut;

    @Enumerated(EnumType.STRING)
    @Column(name = "causal", nullable = false)
    private OppositionCausal causal;

    // Art. 8° a): obligatorio si causal = INTERES_LEGITIMO
    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;

    @Column(name = "opposed_treatment", nullable = false, columnDefinition = "TEXT")
    private String opposedTreatment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OppositionStatus status;

    // Art. 8° b): MARKETING_DIRECTO es irrechazable — el analista no puede rechazarlo
    @Column(name = "requires_mandatory_acceptance", nullable = false)
    private boolean requiresMandatoryAcceptance = false;

    // Art. 23: flag para futuro régimen de organismos públicos
    @Column(name = "is_public_entity", nullable = false)
    private boolean publicEntity = false;

    @JsonIgnore
    @OneToMany(mappedBy = "oppositionRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TemporaryBlock> temporaryBlocks = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "oppositionRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AgencyClaim> agencyClaims = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "oppositionRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ThirdPartyNotification> thirdPartyNotifications = new ArrayList<>();
}
