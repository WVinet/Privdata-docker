package cl.privdata.complianceService.DTO.response;

import java.util.UUID;

public class DataCategoryResponseDTO {

    private UUID id;
    private String name;
    private String description;
    private boolean sensitive;
    private boolean active;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isSensitive() { return sensitive; }
    public void setSensitive(boolean sensitive) { this.sensitive = sensitive; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
