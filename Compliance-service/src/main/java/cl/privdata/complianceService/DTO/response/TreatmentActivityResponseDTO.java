package cl.privdata.complianceService.DTO.response;

import cl.privdata.complianceService.model.enums.LegalBasis;
import cl.privdata.complianceService.model.enums.TreatmentActivityStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class TreatmentActivityResponseDTO {

    private UUID id;
    private UUID organizationId;
    private String name;
    private String description;
    private String purpose;
    private LegalBasis legalBasis;
    private String dataSubjectCategories;
    private Integer retentionPeriodDays;
    private String thirdPartyRecipients;
    private boolean internationalTransfer;
    private String dataSystems;
    private String securityMeasures;
    private boolean hasAutomatedDecisions;
    private String profilingDescription;
    private TreatmentActivityStatus status;
    private boolean containsSensitiveData;
    private List<DataCategoryResponseDTO> dataCategories;
    private List<TerceroResponseDTO> terceros;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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

    public boolean isContainsSensitiveData() { return containsSensitiveData; }
    public void setContainsSensitiveData(boolean containsSensitiveData) { this.containsSensitiveData = containsSensitiveData; }

    public List<DataCategoryResponseDTO> getDataCategories() { return dataCategories; }
    public void setDataCategories(List<DataCategoryResponseDTO> dataCategories) { this.dataCategories = dataCategories; }

    public List<TerceroResponseDTO> getTerceros() { return terceros; }
    public void setTerceros(List<TerceroResponseDTO> terceros) { this.terceros = terceros; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
