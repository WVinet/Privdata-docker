package cl.privdata.complianceService.model;

import cl.privdata.complianceService.model.enums.LegalBasis;
import cl.privdata.complianceService.model.enums.TreatmentActivityStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "treatment_activities")
public class TreatmentActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 255)
    private String purpose;

    @Enumerated(EnumType.STRING)
    @Column(name = "legal_basis", nullable = false, length = 30)
    private LegalBasis legalBasis;

    // Categorías de titulares (ej: "clientes, empleados, proveedores") - Art. 49 c)
    @Column(name = "data_subject_categories", length = 255)
    private String dataSubjectCategories;

    // Período de retención en días - Art. 3 c)
    @Column(name = "retention_period_days")
    private Integer retentionPeriodDays;

    // Destinatarios/terceros que reciben los datos - Art. 15
    @Column(name = "third_party_recipients", columnDefinition = "TEXT")
    private String thirdPartyRecipients;

    // Transferencia internacional - Art. 26-28
    @Column(name = "international_transfer", nullable = false)
    private boolean internationalTransfer = false;

    // JSON array con los servicios donde viven los datos (para el orquestador)
    // Ej: ["organization-service", "compliance-service"]
    @Column(name = "data_systems", columnDefinition = "TEXT")
    private String dataSystems;

    // Medidas de seguridad aplicadas - Art. 14 quinquies
    @Column(name = "security_measures", columnDefinition = "TEXT")
    private String securityMeasures;

    // Decisiones automatizadas / perfilamiento - Art. 9 Ley 21.719
    @Column(name = "has_automated_decisions", nullable = false, columnDefinition = "boolean default false")
    private boolean hasAutomatedDecisions = false;

    @Column(name = "profiling_description", columnDefinition = "TEXT")
    private String profilingDescription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TreatmentActivityStatus status = TreatmentActivityStatus.ACTIVE;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getOrganizationId() { return organizationId; }
    public void setOrganizationId(UUID organizationId) { this.organizationId = organizationId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public LegalBasis getLegalBasis() { return legalBasis; }
    public void setLegalBasis(LegalBasis legalBasis) { this.legalBasis = legalBasis; }

    public String getDataSubjectCategories() { return dataSubjectCategories; }
    public void setDataSubjectCategories(String dataSubjectCategories) { this.dataSubjectCategories = dataSubjectCategories; }

    public Integer getRetentionPeriodDays() { return retentionPeriodDays; }
    public void setRetentionPeriodDays(Integer retentionPeriodDays) { this.retentionPeriodDays = retentionPeriodDays; }

    public String getThirdPartyRecipients() { return thirdPartyRecipients; }
    public void setThirdPartyRecipients(String thirdPartyRecipients) { this.thirdPartyRecipients = thirdPartyRecipients; }

    public boolean isInternationalTransfer() { return internationalTransfer; }
    public void setInternationalTransfer(boolean internationalTransfer) { this.internationalTransfer = internationalTransfer; }

    public String getDataSystems() { return dataSystems; }
    public void setDataSystems(String dataSystems) { this.dataSystems = dataSystems; }

    public String getSecurityMeasures() { return securityMeasures; }
    public void setSecurityMeasures(String securityMeasures) { this.securityMeasures = securityMeasures; }

    public boolean isHasAutomatedDecisions() { return hasAutomatedDecisions; }
    public void setHasAutomatedDecisions(boolean hasAutomatedDecisions) { this.hasAutomatedDecisions = hasAutomatedDecisions; }

    public String getProfilingDescription() { return profilingDescription; }
    public void setProfilingDescription(String profilingDescription) { this.profilingDescription = profilingDescription; }

    public TreatmentActivityStatus getStatus() { return status; }
    public void setStatus(TreatmentActivityStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
