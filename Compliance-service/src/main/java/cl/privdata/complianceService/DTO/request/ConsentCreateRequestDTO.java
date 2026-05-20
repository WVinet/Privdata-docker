package cl.privdata.complianceService.DTO.request;

import java.time.LocalDateTime;
import java.util.UUID;

import org.antlr.v4.runtime.misc.NotNull;

import cl.privdata.complianceService.model.enums.CollectionMethod;

public class ConsentCreateRequestDTO {

    @NotNull
    private UUID organizationId;

    @NotNull
    private UUID dataSubjectId;

    @NotNull
    private UUID purposeId;

    @NotNull
    private UUID policyVersionId;

    private LocalDateTime expiresAt;

    @NotNull
    private CollectionMethod collectionMethod;

    private String notes;
    private String evidenceUrl;

    private UUID performedByUserId;
    private String channel;
    private String ipAddress;
    private String userAgent;
    private String textSnapshot;

    public ConsentCreateRequestDTO() {
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getEvidenceUrl() {
        return evidenceUrl;
    }

    public void setEvidenceUrl(String evidenceUrl) {
        this.evidenceUrl = evidenceUrl;
    }

    public UUID getPerformedByUserId() {
        return performedByUserId;
    }

    public void setPerformedByUserId(UUID performedByUserId) {
        this.performedByUserId = performedByUserId;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getTextSnapshot() {
        return textSnapshot;
    }

    public void setTextSnapshot(String textSnapshot) {
        this.textSnapshot = textSnapshot;
    }
}
