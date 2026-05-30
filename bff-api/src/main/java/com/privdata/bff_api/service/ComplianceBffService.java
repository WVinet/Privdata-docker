package com.privdata.bff_api.service;

import com.privdata.bff_api.client.ComplianceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ComplianceBffService {

    private final ComplianceClient complianceClient;

    public Object getConsentsByDataSubject(String dataSubjectId) {
        return complianceClient.getConsentsByDataSubject(dataSubjectId);
    }

    public Object getRat(String organizationId) {
        return complianceClient.getRat(organizationId);
    }

    public Object revokeConsent(String consentId) {
        return complianceClient.revokeConsent(consentId, null);
    }

    public Object getDataCategories() {
        return complianceClient.getDataCategories();
    }

    public Object listConsents(String status, Integer page, Integer size) {
        return complianceClient.listConsents(status, page, size);
    }
}
