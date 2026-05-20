package cl.privdata.complianceService.DTO.response;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import cl.privdata.complianceService.model.enums.CollectionMethod;
import cl.privdata.complianceService.model.enums.ConsentStatus;

public class ConsentResponseDTO {

    private UUID id;
    private UUID organizationId;
    private UUID dataSubjectId;
    private UUID purposeId;
    private UUID policyVersionId;
    private ConsentStatus status;
    private LocalDateTime grantedAt;
    private LocalDateTime revokedAt;
    private LocalDateTime expiresAt;
    private CollectionMethod collectionMethod;
    private String evidenceHash;
    private String evidenceUrl;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<UUID> categoryIds = new ArrayList<>();

    public ConsentResponseDTO() {
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

    public UUID getDataSubjectId() {
        return dataSubjectId;
    }

    public void setDataSubjectId(UUID dataSubjectId) {
        this.dataSubjectId = dataSubjectId;
    }

    public UUID getPurposeId() {
        return purposeId;
    }

    public void setPurposeId(UUID purposeId) {
        this.purposeId = purposeId;
    }

    public UUID getPolicyVersionId() {
        return policyVersionId;
    }

    public void setPolicyVersionId(UUID policyVersionId) {
        this.policyVersionId = policyVersionId;
    }

    public ConsentStatus getStatus() {
        return status;
    }

    public void setStatus(ConsentStatus status) {
        this.status = status;
    }

    public LocalDateTime getGrantedAt() {
        return grantedAt;
    }

    public void setGrantedAt(LocalDateTime grantedAt) {
        this.grantedAt = grantedAt;
    }

    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(LocalDateTime revokedAt) {
        this.revokedAt = revokedAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public CollectionMethod getCollectionMethod() {
        return collectionMethod;
    }

    public void setCollectionMethod(CollectionMethod collectionMethod) {
        this.collectionMethod = collectionMethod;
    }

    public String getEvidenceHash() {
        return evidenceHash;
    }

    public void setEvidenceHash(String evidenceHash) {
        this.evidenceHash = evidenceHash;
    }

    public String getEvidenceUrl() {
        return evidenceUrl;
    }

    public void setEvidenceUrl(String evidenceUrl) {
        this.evidenceUrl = evidenceUrl;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<UUID> getCategoryIds() {
        return categoryIds;
    }

    public void setCategoryIds(List<UUID> categoryIds) {
        this.categoryIds = categoryIds;
    }
}