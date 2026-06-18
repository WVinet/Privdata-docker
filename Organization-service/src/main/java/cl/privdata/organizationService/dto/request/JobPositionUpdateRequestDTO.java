package cl.privdata.organizationService.dto.request;

import jakarta.validation.constraints.NotBlank;

public class JobPositionUpdateRequestDTO {

    @NotBlank(message = "El nombre del cargo es obligatorio")
    private String name;

    private String description;

    public JobPositionUpdateRequestDTO() {
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
}
