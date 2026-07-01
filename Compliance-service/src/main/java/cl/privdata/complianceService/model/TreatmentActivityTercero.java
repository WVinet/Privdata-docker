package cl.privdata.complianceService.model;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(
    name = "treatment_activity_terceros",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_rat_tercero", columnNames = {"treatment_activity_id", "tercero_id"})
    }
)
public class TreatmentActivityTercero {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "treatment_activity_id", nullable = false)
    private UUID treatmentActivityId;

    @Column(name = "tercero_id", nullable = false)
    private UUID terceroId;

    public TreatmentActivityTercero() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTreatmentActivityId() { return treatmentActivityId; }
    public void setTreatmentActivityId(UUID treatmentActivityId) { this.treatmentActivityId = treatmentActivityId; }

    public UUID getTerceroId() { return terceroId; }
    public void setTerceroId(UUID terceroId) { this.terceroId = terceroId; }
}
