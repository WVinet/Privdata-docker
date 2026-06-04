package com.privdata.bff_api.service;

import com.privdata.bff_api.client.AuditClient;
import com.privdata.bff_api.client.AuthClient;
import com.privdata.bff_api.client.OrganizationClient;
import com.privdata.bff_api.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrganizationBffService {

    private final OrganizationClient organizationClient;
    private final AuthClient         authClient;
    private final AuditClient        auditClient;

    public Object listOrganizations()                                          { return organizationClient.listOrganizations(); }
    public Object getOrganization(String id)                                   { return organizationClient.getOrganization(id); }
    public Object createOrganization(Map<String, Object> body)                 { return organizationClient.createOrganization(body); }
    public Object updateOrganization(String id, Map<String, Object> body)      { return organizationClient.updateOrganization(id, body); }
    public Object updateOrganizationStatus(String id, Map<String, Object> body){ return organizationClient.updateOrganizationStatus(id, body); }

    public Object listDepartments(String orgId)                                        { return organizationClient.listDepartments(orgId); }
    public Object getDepartment(String orgId, String deptId)                           { return organizationClient.getDepartment(orgId, deptId); }
    public Object createDepartment(String orgId, Map<String, Object> body)             { return organizationClient.createDepartment(orgId, body); }
    public Object updateDepartment(String orgId, String deptId, Map<String, Object> b) { return organizationClient.updateDepartment(orgId, deptId, b); }
    public Object updateDepartmentStatus(String orgId, String deptId, Map<String, Object> b){ return organizationClient.updateDepartmentStatus(orgId, deptId, b); }

    public Object getPerson(String orgId, String personId)                     { return organizationClient.getPerson(orgId, personId); }
    public Object listPersons(String orgId, String departmentId)               { return organizationClient.listPersons(orgId, departmentId); }
    public Object updatePerson(String orgId, String personId, Map<String, Object> b)      { return organizationClient.updatePerson(orgId, personId, b); }
    public Object updatePersonStatus(String orgId, String personId, Map<String, Object> b){ return organizationClient.updatePersonStatus(orgId, personId, b); }

    /**
     * Orquesta: crea Person en Organization-service → invita User[PENDING] en Auth-service.
     * Devuelve { person, user: { userId, email, temporaryPassword } }
     */
    @SuppressWarnings("unchecked")
    public Object invitePerson(String orgId, Map<String, Object> body, String authorization) {
        String email    = (String) body.get("email");
        String roleName = (String) body.get("roleName");

        if (email == null || roleName == null) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Email y rol son requeridos");
            err.put("data", null);
            return err;
        }

        // 1. Crear Person en Organization-service
        Map<String, Object> personBody = new HashMap<>(body);
        personBody.remove("roleName");

        Object personResult = organizationClient.createPerson(orgId, personBody);

        if (!(personResult instanceof Map<?, ?> personMap) || Boolean.FALSE.equals(personMap.get("success"))) {
            return personResult != null ? personResult : errorMap("Error al crear la persona en Organization-service");
        }

        Object dataObj = ((Map<?, ?>) personResult).get("data");
        if (!(dataObj instanceof Map<?, ?> personData)) {
            return errorMap("Respuesta inesperada de Organization-service: sin 'data'");
        }

        // .toString() cubre tanto String como UUID object
        Object idObj = personData.get("id");
        if (idObj == null) {
            return errorMap("Respuesta inesperada de Organization-service: sin 'id' en persona");
        }
        String personId = idObj.toString();

        // 2. Invitar usuario en Auth-service (HashMap para permitir valores null si los hubiera)
        Map<String, Object> inviteBody = new HashMap<>();
        inviteBody.put("email",          email);
        inviteBody.put("organizationId", orgId);
        inviteBody.put("personId",       personId);
        inviteBody.put("roleName",       roleName);

        Object userResult = authClient.invite(authorization, inviteBody);

        // Si Auth-service falló, Person ya fue creada — informamos ambos estados
        boolean authOk = userResult instanceof Map<?, ?> um && Boolean.TRUE.equals(um.get("success"));

        Map<String, Object> data = new HashMap<>();
        data.put("person", personData);
        data.put("user",   userResult);

        if (authOk) {
            auditClient.log(orgId, "INVITAR", "Titular",
                    "Nuevo titular invitado: " + email,
                    JwtUtil.extractEmail(authorization));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", authOk);
        response.put("message", authOk ? "Persona invitada correctamente" : "Persona creada pero falló la invitación de usuario");
        response.put("data",    data);
        return response;
    }

    private Map<String, Object> errorMap(String message) {
        Map<String, Object> m = new HashMap<>();
        m.put("success", false);
        m.put("message", message);
        m.put("data",    null);
        return m;
    }
}
