package cl.privdata.organizationService.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
public class DepartmentResponseDTO {

    private UUID id;
    private UUID organizationId;
    private String name;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public DepartmentResponseDTO() {
    }

    public DepartmentResponseDTO(
            UUID id,
            UUID organizationId,
            String name,
            String description,
            Boolean isActive,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.organizationId = organizationId;
        this.name = name;
        this.description = description;
        this.isActive = isActive;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}