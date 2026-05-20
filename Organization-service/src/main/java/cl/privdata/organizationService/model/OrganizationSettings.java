package cl.privdata.organizationService.model;

import jakarta.persistence.*;


import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "organization_settings")


public class OrganizationSettings {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne
    @JoinColumn(name = "organization_id", nullable = false, unique = true)
    private Organization organization;

    @Column(name = "default_language", nullable = false, length = 20)
    private String defaultLanguage;

    @Column(name = "privacy_email", length = 150)
    private String privacyEmail;

    @Column(name = "allow_data_exports", nullable = false)
    private Boolean allowDataExports;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
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


