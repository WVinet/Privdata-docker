package com.privdata.bff_api.service;

import com.privdata.bff_api.client.AuditClient;
import com.privdata.bff_api.client.ComplianceClient;
import com.privdata.bff_api.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ComplianceBffService {

    private final ComplianceClient complianceClient;
    private final AuditClient      auditClient;

    public Object getConsentsByDataSubject(String dataSubjectId) {
        return complianceClient.getConsentsByDataSubject(dataSubjectId);
    }

    public Object getRat(String organizationId, String status) {
        return complianceClient.getRat(organizationId, status);
    }

    public Object createRat(Object body, String authorization) {
        Object result = complianceClient.createRat(body);
        String orgId = null;
        String name  = "nueva actividad";
        if (body instanceof Map<?, ?> m) {
            Object o = m.get("organizationId");
            Object n = m.get("name");
            if (o != null) orgId = o.toString();
            if (n != null) name  = n.toString();
        }
        auditClient.log(orgId, "CREATE", "Actividad de Tratamiento",
                "Actividad de tratamiento creada: \"" + name + "\"",
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object updateRat(String id, Object body, String authorization) {
        Object result = complianceClient.updateRat(id, body);
        auditClient.log(null, "UPDATE", "Actividad de Tratamiento",
                "Actividad de tratamiento actualizada (id: " + id + ")",
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object revokeConsent(String consentId, String authorization) {
        Object result = complianceClient.revokeConsent(consentId, null);
        auditClient.log(null, "REVOCAR", "Consentimiento",
                "Consentimiento revocado (id: " + consentId + ")",
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object getDataCategories() {
        return complianceClient.getDataCategories();
    }

    public Object listConsents(String status, Integer page, Integer size) {
        return complianceClient.listConsents(status, page, size);
    }

    public Object createConsent(Object body, String authorization) {
        Object result = complianceClient.createConsent(body);
        String orgId = null;
        String subjectId = null;
        if (body instanceof Map<?, ?> m) {
            Object o = m.get("organizationId");
            Object s = m.get("dataSubjectId");
            if (o != null) orgId     = o.toString();
            if (s != null) subjectId = s.toString();
        }
        auditClient.log(orgId, "CREATE", "Consentimiento",
                "Consentimiento registrado para titular " + (subjectId != null ? subjectId : "desconocido"),
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object grantConsent(String consentId) {
        return complianceClient.grantConsent(consentId, null);
    }

    public Object getPendingConsents(String organizationId, String personId) {
        return complianceClient.getPendingConsents(organizationId, personId);
    }

    public Object getConsentDefinitions(String organizationId) {
        return complianceClient.getConsentDefinitions(organizationId);
    }

    public Object createConsentDefinition(Object body, String authorization) {
        Object result = complianceClient.createConsentDefinition(body);
        String orgId  = null;
        String title  = "nueva definición";
        if (body instanceof Map<?, ?> m) {
            Object o = m.get("organizationId");
            Object t = m.get("title");
            if (o != null) orgId  = o.toString();
            if (t != null) title  = t.toString();
        }
        auditClient.log(orgId, "CREATE", "Definición de Consentimiento",
                "Definición creada: \"" + title + "\"",
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object getTerceros(String organizationId, Boolean onlyActive) {
        return complianceClient.getTerceros(organizationId, onlyActive);
    }

    public Object getTerceroById(String id) {
        return complianceClient.getTerceroById(id);
    }

    public Object createTercero(Object body, String authorization) {
        Object result = complianceClient.createTercero(body);
        String orgId = null;
        String nombre = "nuevo tercero";
        if (body instanceof Map<?, ?> m) {
            Object o = m.get("organizationId");
            Object n = m.get("nombre");
            if (o != null) orgId  = o.toString();
            if (n != null) nombre = n.toString();
        }
        auditClient.log(orgId, "CREATE", "Tercero",
                "Tercero registrado: \"" + nombre + "\"",
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object updateTercero(String id, Object body, String authorization) {
        Object result = complianceClient.updateTercero(id, body);
        auditClient.log(null, "UPDATE", "Tercero",
                "Tercero actualizado (id: " + id + ")",
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object deleteTercero(String id, String authorization) {
        Object result = complianceClient.deleteTercero(id);
        auditClient.log(null, "DELETE", "Tercero",
                "Tercero eliminado (id: " + id + ")",
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object setConsentDefinitionActive(String id, boolean value, String authorization) {
        Object result = complianceClient.setConsentDefinitionActive(id, value);
        String action = value ? "PUBLICAR" : "RETIRAR";
        String detail = value
                ? "Definición publicada a titulares (id: " + id + ")"
                : "Definición retirada (id: " + id + ")";
        auditClient.log(null, action, "Definición de Consentimiento", detail,
                JwtUtil.extractEmail(authorization));
        return result;
    }
}
