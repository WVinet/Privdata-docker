package com.privdata.bff_api.service;

import com.privdata.bff_api.client.ArcoClient;
import com.privdata.bff_api.client.AuditClient;
import com.privdata.bff_api.client.AuthClient;
import com.privdata.bff_api.client.OrganizationClient;
import com.privdata.bff_api.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArcoBffService {

//    private static final Map<String, String> REQUEST_TYPE_LABELS = Map.of(
//            "ACCESO", "Acceso",
//            "RECTIFICACION", "Rectificación",
//            "SUPRESION", "Supresión",
//            "OPOSICION", "Oposición",
//            "PORTABILIDAD", "Portabilidad",
//            "BLOQUEO_TEMPORAL", "Bloqueo temporal"
//    );
//
//    private static final Map<String, String> STATUS_LABELS = Map.of(
//            "RESPONDIDA", "respondida",
//            "RECHAZADA", "rechazada"
//    );

    private final ArcoClient          arcoClient;
    private final AuditClient         auditClient;
//    private final AuthClient          authClient;
//    private final OrganizationClient  organizationClient;

    public Object findAll(String organizationId)          { return arcoClient.findAll(organizationId); }
    public Object findById(String id)                     { return arcoClient.findById(id); }
    public Object findByDataSubject(String dataSubjectId) { return arcoClient.findByDataSubject(dataSubjectId); }
    public Object startReview(String id)                  { return arcoClient.startReview(id); }

    public Object create(Map<String, Object> body, String authorization) {
        Object result = arcoClient.create(body);
        String orgId  = body.get("organizationId") != null ? body.get("organizationId").toString() : null;
        String type   = body.get("requestType")    != null ? body.get("requestType").toString()    : "ARSO";
        String id     = extractDataField(result, "id");
        auditClient.log(orgId, "CREATE", "Solicitud ARSO",
                "Nueva solicitud " + type + " registrada " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object updateStatus(String id, Map<String, Object> body, String authorization) {
        Object result  = arcoClient.updateStatus(id, body, authorization);
        String orgId   = extractDataField(result, "organizationId");
        String status  = body.get("status") != null ? body.get("status").toString() : "actualizado";

        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Estado actualizado a '" + status + "' para solicitud " + id,
                JwtUtil.extractEmail(authorization));

        return result;
    }

    public Object extendDeadline(String id, String authorization) {
        Object result = arcoClient.extendDeadline(id);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Prórroga de 30 días otorgada para solicitud " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object registrarDisconformidad(String id, Map<String, Object> body, String authorization) {
        Object result = arcoClient.registrarDisconformidad(id, body);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Disconformidad registrada para solicitud " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object updateVerificacionIdentidad(String id, String nuevoEstado) {
        return arcoClient.updateVerificacionIdentidad(id, nuevoEstado);
    }

    public Object verifyAccessIdentity(String id, Map<String, Object> body, String authorization) {
        Object result = arcoClient.verifyAccessIdentity(id, body);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Verificación de identidad registrada para solicitud de acceso " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object respondAccess(String id, Map<String, Object> body, String authorization) {
        Object result = arcoClient.respondAccess(id, body);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Solicitud de acceso respondida " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object createRectification(Map<String, Object> body, String authorization) {
        Object result = arcoClient.createRectification(body);
        String orgId  = extractDataField(result, "organizationId");
        String id     = extractDataField(result, "id");
        auditClient.log(orgId, "CREATE", "Solicitud ARSO",
                "Nueva solicitud de rectificación registrada " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object verifyRectificationIdentity(String id, Map<String, Object> body, String authorization) {
        Object result = arcoClient.verifyRectificationIdentity(id, body);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Verificación de identidad registrada para solicitud de rectificación " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object respondRectification(String id, Map<String, Object> body, String authorization) {
        Object result = arcoClient.respondRectification(id, body);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Solicitud de rectificación respondida " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object createSuppression(Map<String, Object> body, String authorization) {
        Object result = arcoClient.createSuppression(body);
        String orgId  = extractDataField(result, "organizationId");
        String id     = extractDataField(result, "id");
        auditClient.log(orgId, "CREATE", "Solicitud ARSO",
                "Nueva solicitud de supresión registrada " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object verifySuppressionIdentity(String id, Map<String, Object> body, String authorization) {
        Object result = arcoClient.verifySuppressionIdentity(id, body);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Verificación de identidad registrada para solicitud de supresión " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object respondSuppression(String id, Map<String, Object> body, String authorization) {
        Object result = arcoClient.respondSuppression(id, body);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Solicitud de supresión respondida " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object createOpposition(Map<String, Object> body, String authorization) {
        Object result = arcoClient.createOpposition(body);
        String orgId  = extractDataField(result, "organizationId");
        String id     = extractDataField(result, "id");
        auditClient.log(orgId, "CREATE", "Solicitud ARSO",
                "Nueva solicitud de oposición registrada " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object verifyOppositionIdentity(String id, Map<String, Object> body, String authorization) {
        Object result = arcoClient.verifyOppositionIdentity(id, body);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Verificación de identidad registrada para solicitud de oposición " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object respondOpposition(String id, Map<String, Object> body, String authorization) {
        Object result = arcoClient.respondOpposition(id, body);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Solicitud de oposición respondida " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object reclamarAnteAgencia(String id, String authorization) {
        Object result = arcoClient.reclamarAnteAgencia(id);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Reclamo registrado ante la Agencia para la solicitud " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object createPortability(Map<String, Object> body, String authorization) {
        Object result = arcoClient.createPortability(body);
        String orgId  = extractDataField(result, "organizationId");
        String id     = extractDataField(result, "id");
        auditClient.log(orgId, "CREATE", "Solicitud ARSO",
                "Nueva solicitud de portabilidad registrada " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object verifyPortabilityIdentity(String id, Map<String, Object> body, String authorization) {
        Object result = arcoClient.verifyPortabilityIdentity(id, body);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Verificación de identidad registrada para solicitud de portabilidad " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object respondPortability(String id, Map<String, Object> body, String authorization) {
        Object result = arcoClient.respondPortability(id, body);
        String orgId  = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Solicitud de portabilidad respondida " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public org.springframework.http.ResponseEntity<byte[]> downloadPortability(String id) {
        return arcoClient.downloadPortability(id);
    }

    public Object uploadRectificationDocument(String id, MultipartFile file, String authorization) {
        Object result = arcoClient.uploadRectificationDocument(id, file);
        String orgId = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Documento de respaldo adjuntado a solicitud de rectificación " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public ResponseEntity<byte[]> downloadRectificationDocument(String id) {
        return arcoClient.downloadRectificationDocument(id);
    }

    public Object uploadAccessResponseDocument(String id, MultipartFile file, String authorization) {
        Object result = arcoClient.uploadAccessResponseDocument(id, file);
        String orgId = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Documento PDF de respuesta adjuntado a solicitud de acceso " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public ResponseEntity<byte[]> downloadAccessResponseDocument(String id) {
        return arcoClient.downloadAccessResponseDocument(id);
    }

    public Object uploadOppositionDocument(String id, MultipartFile file, String authorization) {
        Object result = arcoClient.uploadOppositionDocument(id, file);
        String orgId = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Documento de respaldo adjuntado a solicitud de oposición " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public ResponseEntity<byte[]> downloadOppositionDocument(String id) {
        return arcoClient.downloadOppositionDocument(id);
    }

    public Object applyBlock(String id, String authorization) {
        Object result = arcoClient.applyBlock(id, JwtUtil.extractEmail(authorization));
        String orgId = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Bloqueo provisional aplicado para solicitud " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object liftBlock(String id, String authorization) {
        Object result = arcoClient.liftBlock(id);
        String orgId = extractDataField(result, "organizationId");
        auditClient.log(orgId, "UPDATE", "Solicitud ARSO",
                "Bloqueo provisional levantado para solicitud " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }

    private String extractDataField(Object result, String key) {
        if (!(result instanceof Map<?, ?> resultMap) || !(resultMap.get("data") instanceof Map<?, ?> data)) return null;
        Object value = data.get(key);
        return value != null ? value.toString() : null;
    }

//    private void notifyDataSubject(Object result, String status) {
//        try {
//            if (!(result instanceof Map<?, ?> resultMap) || !Boolean.TRUE.equals(resultMap.get("success"))) return;
//            if (!(resultMap.get("data") instanceof Map<?, ?> data)) return;
//
//            String organizationId    = String.valueOf(data.get("organizationId"));
//            String dataSubjectId     = String.valueOf(data.get("dataSubjectId"));
//            String requestType       = String.valueOf(data.get("requestType"));
//            Object resolutionSummary = data.get("resolutionSummary");
//            Object denialLegalBasis  = data.get("denialLegalBasis");
//
//            Object personResult = organizationClient.getPerson(organizationId, dataSubjectId);
//            if (!(personResult instanceof Map<?, ?> personResponse) || !Boolean.TRUE.equals(personResponse.get("success"))) return;
//            if (!(personResponse.get("data") instanceof Map<?, ?> person)) return;
//
//            Object email = person.get("email");
//            if (email == null || email.toString().isBlank()) return;
//
//            Map<String, Object> notification = new HashMap<>();
//            notification.put("email", email.toString());
//            notification.put("requestTypeLabel", REQUEST_TYPE_LABELS.getOrDefault(requestType, requestType));
//            notification.put("statusLabel", STATUS_LABELS.get(status));
//            notification.put("resolutionSummary", resolutionSummary);
//            notification.put("denialLegalBasis", denialLegalBasis);
//
//            authClient.sendArcoResolutionEmail(notification);
//        } catch (Exception e) {
//            log.warn("No se pudo notificar por correo al titular de la solicitud ARCO: {}", e.getMessage());
//        }
//    }
}
