package cl.privdata.organizationService.dto.request;

import jakarta.validation.constraints.NotNull;

public class PersonStatusUpdateRequestDTO {

    @NotNull(message = "El campo isActive es obligatorio")
    private Boolean isActive;

    public PersonStatusUpdateRequestDTO() {
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
