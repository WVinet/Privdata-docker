package cl.privdata.organizationService.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

public class OrganizationSettingsResponseDTO {

    private UUID id;
    private UUID organizationId;
    private String defaultLanguage;
    private String privacyEmail;
    private Boolean allowDataExports;
    private LocalDateTime updatedAt;

    public OrganizationSettingsResponseDTO() {
    }

    public OrganizationSettingsResponseDTO(
            UUID id,
            UUID organizationId,
            String defaultLanguage,
            String privacyEmail,
            Boolean allowDataExports,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.organizationId = organizationId;
        this.defaultLanguage = defaultLanguage;
        this.privacyEmail = privacyEmail;
        this.allowDataExports = allowDataExports;
        this.updatedAt = updatedAt;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}