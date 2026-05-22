package cl.privdata.complianceService.model;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(
    name = "treatment_activity_data_categories",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_rat_category", columnNames = {"treatment_activity_id", "data_category_id"})
    }
)
public class TreatmentActivityDataCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "treatment_activity_id", nullable = false)
    private UUID treatmentActivityId;

    @Column(name = "data_category_id", nullable = false)
    private UUID dataCategoryId;

    public TreatmentActivityDataCategory() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getTreatmentActivityId() { return treatmentActivityId; }
    public void setTreatmentActivityId(UUID treatmentActivityId) { this.treatmentActivityId = treatmentActivityId; }

    public UUID getDataCategoryId() { return dataCategoryId; }
    public void setDataCategoryId(UUID dataCategoryId) { this.dataCategoryId = dataCategoryId; }
}
