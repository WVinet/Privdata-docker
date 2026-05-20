package cl.privdata.complianceService.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.privdata.complianceService.DTO.request.ConsentActionRequestDTO;
import cl.privdata.complianceService.DTO.request.ConsentCategoriesUpdateRequestDTO;
import cl.privdata.complianceService.DTO.request.ConsentCreateRequestDTO;
import cl.privdata.complianceService.DTO.response.ConsentEventResponseDTO;
import cl.privdata.complianceService.DTO.response.ConsentResponseDTO;
import cl.privdata.complianceService.model.Consent;
import cl.privdata.complianceService.model.ConsentDataCategory;
import cl.privdata.complianceService.model.ConsentEvent;
import cl.privdata.complianceService.model.enums.ConsentEventType;
import cl.privdata.complianceService.model.enums.ConsentStatus;
import cl.privdata.complianceService.repository.ConsentDataCategoryRepository;
import cl.privdata.complianceService.repository.ConsentEventRepository;
import cl.privdata.complianceService.repository.ConsentRepository;

@Service
public class ConsentService {

    private final ConsentRepository consentRepository;
    private final ConsentEventRepository consentEventRepository;
    private final ConsentDataCategoryRepository consentDataCategoryRepository;

    public ConsentService(
            ConsentRepository consentRepository,
            ConsentEventRepository consentEventRepository,
            ConsentDataCategoryRepository consentDataCategoryRepository
    ) {
        this.consentRepository = consentRepository;
        this.consentEventRepository = consentEventRepository;
        this.consentDataCategoryRepository = consentDataCategoryRepository;
    }

    public Page<ConsentResponseDTO> getAll(UUID dataSubjectId, ConsentStatus status, Pageable pageable) {
        Page<Consent> page;

        if (dataSubjectId != null && status != null) {
            page = consentRepository.findByDataSubjectIdAndStatus(dataSubjectId, status, pageable);
        } else if (dataSubjectId != null) {
            page = consentRepository.findByDataSubjectId(dataSubjectId, pageable);
        } else if (status != null) {
            page = consentRepository.findByStatus(status, pageable);
        } else {
            page = consentRepository.findAll(pageable);
        }

        return page.map(this::toResponse);
    }

    public ConsentResponseDTO getById(UUID id) {
        Consent consent = findConsentOrThrow(id);
        return toResponse(consent);
    }

    public List<ConsentResponseDTO> getByDataSubjectId(UUID dataSubjectId) {
        List<ConsentResponseDTO> result = new ArrayList<>();
        consentRepository.findByDataSubjectId(dataSubjectId, Pageable.unpaged())
                .forEach(consent -> result.add(toResponse(consent)));
        return result;
    }

    @Transactional
    public ConsentResponseDTO create(ConsentCreateRequestDTO request) {
        LocalDateTime now = LocalDateTime.now();

        Consent consent = new Consent();
        consent.setOrganizationId(request.getOrganizationId());
        consent.setDataSubjectId(request.getDataSubjectId());
        consent.setPurposeId(request.getPurposeId());
        consent.setPolicyVersionId(request.getPolicyVersionId());
        consent.setStatus(ConsentStatus.ACTIVE);
        consent.setGrantedAt(now);
        consent.setRevokedAt(null);
        consent.setExpiresAt(request.getExpiresAt());
        consent.setCollectionMethod(request.getCollectionMethod());
        consent.setNotes(request.getNotes());
        consent.setEvidenceUrl(request.getEvidenceUrl());

        String evidenceHash = generateSha256(
                request.getDataSubjectId() + "|" +
                request.getPurposeId() + "|" +
                request.getPolicyVersionId() + "|" +
                request.getCollectionMethod() + "|" +
                now
        );
        consent.setEvidenceHash(evidenceHash);

        Consent savedConsent = consentRepository.save(consent);

        ConsentEvent event = new ConsentEvent();
        event.setConsentId(savedConsent.getId());
        event.setEventType(ConsentEventType.GRANT);
        event.setPreviousStatus(null);
        event.setNewStatus(ConsentStatus.ACTIVE);
        event.setEventTimestamp(now);
        event.setPerformedByUserId(request.getPerformedByUserId());
        event.setChannel(request.getChannel());
        event.setIpAddress(request.getIpAddress());
        event.setUserAgent(request.getUserAgent());
        event.setTextSnapshot(request.getTextSnapshot());
        event.setEvidenceHash(generateSha256(savedConsent.getId() + "|GRANT|" + now));
        event.setEvidenceUrl(request.getEvidenceUrl());
        event.setDetailsJson("{\"notes\":\"" + safe(request.getNotes()) + "\"}");

        consentEventRepository.save(event);

        return toResponse(savedConsent);
    }

    @Transactional
    public ConsentResponseDTO updateCategories(UUID consentId, ConsentCategoriesUpdateRequestDTO request) {
        Consent consent = findConsentOrThrow(consentId);

        consentDataCategoryRepository.deleteByConsentId(consentId);

        if (request.getCategoryIds() != null) {
            for (UUID categoryId : request.getCategoryIds()) {
                ConsentDataCategory item = new ConsentDataCategory();
                item.setConsentId(consentId);
                item.setPersonalDataCategoryId(categoryId);
                consentDataCategoryRepository.save(item);
            }
        }

        ConsentEvent event = new ConsentEvent();
        event.setConsentId(consent.getId());
        event.setEventType(ConsentEventType.UPDATE_CATEGORIES);
        event.setPreviousStatus(consent.getStatus());
        event.setNewStatus(consent.getStatus());
        event.setEventTimestamp(LocalDateTime.now());
        event.setEvidenceHash(generateSha256(consent.getId() + "|UPDATE_CATEGORIES|" + LocalDateTime.now()));
        event.setDetailsJson("{\"categoryCount\":" + request.getCategoryIds().size() + "}");

        consentEventRepository.save(event);

        return toResponse(consent);
    }

    @Transactional
    public ConsentResponseDTO revoke(UUID consentId, ConsentActionRequestDTO request) {
        Consent consent = findConsentOrThrow(consentId);

        if (consent.getStatus() == ConsentStatus.REVOKED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El consentimiento ya está revocado.");
        }

        ConsentStatus previousStatus = consent.getStatus();
        LocalDateTime now = LocalDateTime.now();

        consent.setStatus(ConsentStatus.REVOKED);
        consent.setRevokedAt(now);

        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            consent.setNotes(request.getNotes());
        }

        if (request.getEvidenceUrl() != null && !request.getEvidenceUrl().isBlank()) {
            consent.setEvidenceUrl(request.getEvidenceUrl());
        }

        consent.setEvidenceHash(generateSha256(consent.getId() + "|REVOKE|" + now));
        Consent saved = consentRepository.save(consent);

        ConsentEvent event = new ConsentEvent();
        event.setConsentId(saved.getId());
        event.setEventType(ConsentEventType.REVOKE);
        event.setPreviousStatus(previousStatus);
        event.setNewStatus(ConsentStatus.REVOKED);
        event.setEventTimestamp(now);
        event.setPerformedByUserId(request.getPerformedByUserId());
        event.setChannel(request.getChannel());
        event.setIpAddress(request.getIpAddress());
        event.setUserAgent(request.getUserAgent());
        event.setTextSnapshot(request.getTextSnapshot());
        event.setEvidenceHash(generateSha256(saved.getId() + "|REVOKE_EVENT|" + now));
        event.setEvidenceUrl(request.getEvidenceUrl());
        event.setDetailsJson("{\"notes\":\"" + safe(request.getNotes()) + "\"}");

        consentEventRepository.save(event);

        return toResponse(saved);
    }

    @Transactional
    public ConsentResponseDTO grant(UUID consentId, ConsentActionRequestDTO request) {
        Consent consent = findConsentOrThrow(consentId);

        if (consent.getStatus() == ConsentStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El consentimiento ya está activo.");
        }

        ConsentStatus previousStatus = consent.getStatus();
        LocalDateTime now = LocalDateTime.now();

        consent.setStatus(ConsentStatus.ACTIVE);
        consent.setGrantedAt(now);
        consent.setRevokedAt(null);

        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            consent.setNotes(request.getNotes());
        }

        if (request.getEvidenceUrl() != null && !request.getEvidenceUrl().isBlank()) {
            consent.setEvidenceUrl(request.getEvidenceUrl());
        }

        consent.setEvidenceHash(generateSha256(consent.getId() + "|GRANT|" + now));
        Consent saved = consentRepository.save(consent);

        ConsentEvent event = new ConsentEvent();
        event.setConsentId(saved.getId());
        event.setEventType(ConsentEventType.GRANT);
        event.setPreviousStatus(previousStatus);
        event.setNewStatus(ConsentStatus.ACTIVE);
        event.setEventTimestamp(now);
        event.setPerformedByUserId(request.getPerformedByUserId());
        event.setChannel(request.getChannel());
        event.setIpAddress(request.getIpAddress());
        event.setUserAgent(request.getUserAgent());
        event.setTextSnapshot(request.getTextSnapshot());
        event.setEvidenceHash(generateSha256(saved.getId() + "|GRANT_EVENT|" + now));
        event.setEvidenceUrl(request.getEvidenceUrl());
        event.setDetailsJson("{\"notes\":\"" + safe(request.getNotes()) + "\"}");

        consentEventRepository.save(event);

        return toResponse(saved);
    }

    public List<ConsentEventResponseDTO> getEvents(UUID consentId) {
        findConsentOrThrow(consentId);

        List<ConsentEvent> events = consentEventRepository.findByConsentIdOrderByEventTimestampDesc(consentId);
        List<ConsentEventResponseDTO> result = new ArrayList<>();

        for (ConsentEvent event : events) {
            result.add(toEventResponse(event));
        }

        return result;
    }

    private Consent findConsentOrThrow(UUID id) {
        return consentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consentimiento no encontrado."));
    }

    private ConsentResponseDTO toResponse(Consent consent) {
        ConsentResponseDTO response = new ConsentResponseDTO();
        response.setId(consent.getId());
        response.setOrganizationId(consent.getOrganizationId());
        response.setDataSubjectId(consent.getDataSubjectId());
        response.setPurposeId(consent.getPurposeId());
        response.setPolicyVersionId(consent.getPolicyVersionId());
        response.setStatus(consent.getStatus());
        response.setGrantedAt(consent.getGrantedAt());
        response.setRevokedAt(consent.getRevokedAt());
        response.setExpiresAt(consent.getExpiresAt());
        response.setCollectionMethod(consent.getCollectionMethod());
        response.setEvidenceHash(consent.getEvidenceHash());
        response.setEvidenceUrl(consent.getEvidenceUrl());
        response.setNotes(consent.getNotes());
        response.setCreatedAt(consent.getCreatedAt());
        response.setUpdatedAt(consent.getUpdatedAt());

        List<UUID> categoryIds = new ArrayList<>();
        List<ConsentDataCategory> categories = consentDataCategoryRepository.findByConsentId(consent.getId());

        for (ConsentDataCategory item : categories) {
            categoryIds.add(item.getPersonalDataCategoryId());
        }

        response.setCategoryIds(categoryIds);

        return response;
    }

    private ConsentEventResponseDTO toEventResponse(ConsentEvent event) {
        ConsentEventResponseDTO response = new ConsentEventResponseDTO();
        response.setId(event.getId());
        response.setConsentId(event.getConsentId());
        response.setEventType(event.getEventType());
        response.setPreviousStatus(event.getPreviousStatus());
        response.setNewStatus(event.getNewStatus());
        response.setEventTimestamp(event.getEventTimestamp());
        response.setPerformedByUserId(event.getPerformedByUserId());
        response.setChannel(event.getChannel());
        response.setIpAddress(event.getIpAddress());
        response.setUserAgent(event.getUserAgent());
        response.setTextSnapshot(event.getTextSnapshot());
        response.setEvidenceHash(event.getEvidenceHash());
        response.setEvidenceUrl(event.getEvidenceUrl());
        response.setDetailsJson(event.getDetailsJson());
        return response;
    }

    private String generateSha256(String rawValue) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawValue.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                String part = Integer.toHexString(0xff & b);
                if (part.length() == 1) {
                    hex.append('0');
                }
                hex.append(part);
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("No se pudo generar SHA-256.", e);
        }
    }

    private String safe(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\"", "\\\"");
    }
}