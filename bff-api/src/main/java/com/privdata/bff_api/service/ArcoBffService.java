package com.privdata.bff_api.service;

import com.privdata.bff_api.client.ArcoClient;
import com.privdata.bff_api.client.AuditClient;
import com.privdata.bff_api.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ArcoBffService {

    private final ArcoClient  arcoClient;
    private final AuditClient auditClient;

    public Object findAll(String organizationId)          { return arcoClient.findAll(organizationId); }
    public Object findById(String id)                     { return arcoClient.findById(id); }
    public Object findByDataSubject(String dataSubjectId) { return arcoClient.findByDataSubject(dataSubjectId); }

    public Object create(Map<String, Object> body, String authorization) {
        Object result = arcoClient.create(body);
        String orgId  = body.get("organizationId") != null ? body.get("organizationId").toString() : null;
        String type   = body.get("requestType")    != null ? body.get("requestType").toString()    : "ARCO";
        auditClient.log(orgId, "CREATE", "Solicitud ARCO",
                "Nueva solicitud " + type + " registrada",
                JwtUtil.extractEmail(authorization));
        return result;
    }

    public Object updateStatus(String id, Map<String, Object> body, String authorization) {
        Object result  = arcoClient.updateStatus(id, body);
        String orgId   = body.get("organizationId") != null ? body.get("organizationId").toString() : null;
        String status  = body.get("status")         != null ? body.get("status").toString()         : "actualizado";
        auditClient.log(orgId, "UPDATE", "Solicitud ARCO",
                "Estado actualizado a '" + status + "' para solicitud " + id,
                JwtUtil.extractEmail(authorization));
        return result;
    }
}
