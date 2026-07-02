package cl.privdata.complianceService.DTO.request;

import cl.privdata.complianceService.model.enums.LegalBasis;
import cl.privdata.complianceService.model.enums.TreatmentActivityStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public class TreatmentActivityUpdateRequestDTO {

    @NotBlank
    private String name;

    private String description;

    @NotBlank
    private String purpose;

    @NotNull
    private LegalBasis legalBasis;

    private String dataSubjectCategories;

    private Integer retentionPeriodDays;

    private String thirdPartyRecipients;

    private boolean internationalTransfer = false;

    private String dataSystems;

    private String securityMeasures;

    private boolean hasAutomatedDecisions = false;
    private String profilingDescription;

    @NotNull
    private TreatmentActivityStatus status;

    private List<UUID> dataCategoryIds;
    private List<UUID> terceroIds;

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

    public TreatmentActivityStatus getStatus() { return status; }
    public void setStatus(TreatmentActivityStatus status) { this.status = status; }

    public boolean isHasAutomatedDecisions() { return hasAutomatedDecisions; }
    public void setHasAutomatedDecisions(boolean hasAutomatedDecisions) { this.hasAutomatedDecisions = hasAutomatedDecisions; }

    public String getProfilingDescription() { return profilingDescription; }
    public void setProfilingDescription(String profilingDescription) { this.profilingDescription = profilingDescription; }

    public List<UUID> getDataCategoryIds() { return dataCategoryIds; }
    public void setDataCategoryIds(List<UUID> dataCategoryIds) { this.dataCategoryIds = dataCategoryIds; }

    public List<UUID> getTerceroIds() { return terceroIds; }
    public void setTerceroIds(List<UUID> terceroIds) { this.terceroIds = terceroIds; }
}
