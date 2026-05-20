package cl.privdata.organizationService.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

public class OrganizationStatusUpdateRequestDTO {

    @NotNull(message = "El estado isActive es obligatorio")
    private Boolean isActive;

    public OrganizationStatusUpdateRequestDTO() {
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}