package cl.privdata.complianceService.DTO.request;

import java.util.UUID;

import cl.privdata.complianceService.model.enums.LegalBasis;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ConsentDefinitionCreateRequestDTO {

    @NotNull
    private UUID organizationId;

    @NotBlank
    private String title;

    private String description;

    private boolean required = false;

    @NotNull
    private LegalBasis legalBasis;

    public ConsentDefinitionCreateRequestDTO() {
    }

    public UUID getOrganizationId() { return organizationId; }
    public void setOrganizationId(UUID organizationId) { this.organizationId = organizationId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }

    public LegalBasis getLegalBasis() { return legalBasis; }
    public void setLegalBasis(LegalBasis legalBasis) { this.legalBasis = legalBasis; }
}
