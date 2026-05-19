package cl.privdata.organizationService.dto.request;

import jakarta.validation.constraints.NotBlank;

public class DepartmentUpdateRequestDTO {

    @NotBlank(message = "El nombre del departamento es obligatorio")
    private String name;

    private String description;

    public DepartmentUpdateRequestDTO() {
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
