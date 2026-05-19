package cl.privdata.organizationService.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

public class OrganizationSettingsCreateRequestDTO {

    @NotBlank(message = "El idioma por defecto es obligatorio")
    private String defaultLanguage;

    @Email(message = "El correo de privacidad no tiene un formato válido")
    private String privacyEmail;

    @NotNull(message = "El campo allowDataExports es obligatorio")
    private Boolean allowDataExports;

    public OrganizationSettingsCreateRequestDTO() {
    }

    public String getDefaultLanguage() {
        return defaultLanguage;
    }

    public void setDefaultLanguage(String defaultLanguage) {
        this.defaultLanguage = defaultLanguage;
    }

    public String getPrivacyEmail() {
        return privacyEmail;
    }

    public void setPrivacyEmail(String privacyEmail) {
        this.privacyEmail = privacyEmail;
    }

    public Boolean getAllowDataExports() {
        return allowDataExports;
    }

    public void setAllowDataExports(Boolean allowDataExports) {
        this.allowDataExports = allowDataExports;
    }
}
    

