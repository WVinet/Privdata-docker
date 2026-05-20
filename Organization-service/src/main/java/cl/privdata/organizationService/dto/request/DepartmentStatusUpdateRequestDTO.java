package cl.privdata.organizationService.dto.request;

import jakarta.validation.constraints.NotNull;

public class DepartmentStatusUpdateRequestDTO {

    @NotNull(message = "El campo isActive es obligatorio")
    private Boolean isActive;

    public DepartmentStatusUpdateRequestDTO() {
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
