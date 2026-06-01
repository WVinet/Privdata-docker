package cl.privdata.complianceService.DTO.response;

import java.time.LocalDateTime;
import java.util.UUID;

import cl.privdata.complianceService.model.enums.LegalBasis;

public class ConsentDefinitionResponseDTO {

    private UUID id;
    private UUID organizationId;
    private String title;
    private String description;
    private boolean required;
    private LegalBasis legalBasis;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ConsentDefinitionResponseDTO() {
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

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

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
