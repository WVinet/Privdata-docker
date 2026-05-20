package cl.privdata.complianceService.DTO.response;

import java.time.LocalDateTime;
import java.util.UUID;

import cl.privdata.complianceService.model.enums.ConsentEventType;
import cl.privdata.complianceService.model.enums.ConsentStatus;

public class ConsentEventResponseDTO {

    private UUID id;
    private UUID consentId;
    private ConsentEventType eventType;
    private ConsentStatus previousStatus;
    private ConsentStatus newStatus;
    private LocalDateTime eventTimestamp;
    private UUID performedByUserId;
    private String channel;
    private String ipAddress;
    private String userAgent;
    private String textSnapshot;
    private String evidenceHash;
    private String evidenceUrl;
    private String detailsJson;

    public ConsentEventResponseDTO() {
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

    public ConsentEventType getEventType() {
        return eventType;
    }

    public void setEventType(ConsentEventType eventType) {
        this.eventType = eventType;
    }

    public ConsentStatus getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(ConsentStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public ConsentStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(ConsentStatus newStatus) {
        this.newStatus = newStatus;
    }

    public LocalDateTime getEventTimestamp() {
        return eventTimestamp;
    }

    public void setEventTimestamp(LocalDateTime eventTimestamp) {
        this.eventTimestamp = eventTimestamp;
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

    public String getDetailsJson() {
        return detailsJson;
    }

    public void setDetailsJson(String detailsJson) {
        this.detailsJson = detailsJson;
    }
}