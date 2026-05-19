package cl.privdata.complianceService.model;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.annotation.Id;

import cl.privdata.complianceService.model.enums.ConsentEventType;
import cl.privdata.complianceService.model.enums.ConsentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "consent_events")
public class ConsentEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "consent_id", nullable = false)
    private UUID consentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 30)
    private ConsentEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 30)
    private ConsentStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private ConsentStatus newStatus;

    @Column(name = "event_timestamp", nullable = false)
    private LocalDateTime eventTimestamp;

    @Column(name = "performed_by_user_id")
    private UUID performedByUserId;

    @Column(length = 50)
    private String channel;

    @Column(name = "ip_address", length = 100)
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "text_snapshot", columnDefinition = "TEXT")
    private String textSnapshot;

    @Column(name = "evidence_hash", nullable = false, length = 64)
    private String evidenceHash;

    @Column(name = "evidence_url")
    private String evidenceUrl;

    @Column(name = "details_json", columnDefinition = "TEXT")
    private String detailsJson;

    public ConsentEvent() {
    }

    @PrePersist
    public void prePersist() {
        if (this.eventTimestamp == null) {
            this.eventTimestamp = LocalDateTime.now();
        }
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