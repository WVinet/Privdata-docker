package cl.privdata.complianceService.model;

import java.util.UUID;

import org.springframework.data.annotation.Id;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "consent_data_categories",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_consent_category", columnNames = {"consent_id", "personal_data_category_id"})
    }
)
public class ConsentDataCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "consent_id", nullable = false)
    private UUID consentId;

    @Column(name = "personal_data_category_id", nullable = false)
    private UUID personalDataCategoryId;

    public ConsentDataCategory() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getConsentId() {
        return consentId;
    }

    public void setConsentId(UUID consentId) {
        this.consentId = consentId;
    }

    public UUID getPersonalDataCategoryId() {
        return personalDataCategoryId;
    }

    public void setPersonalDataCategoryId(UUID personalDataCategoryId) {
        this.personalDataCategoryId = personalDataCategoryId;
    }
}