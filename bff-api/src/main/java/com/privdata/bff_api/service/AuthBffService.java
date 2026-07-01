package com.privdata.bff_api.service;

import com.privdata.bff_api.client.AuditClient;
import com.privdata.bff_api.client.AuthClient;
import com.privdata.bff_api.dtos.request.LoginRequestDTO;
import com.privdata.bff_api.dtos.request.RegisterRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthBffService {

    private final AuthClient  authClient;
    private final AuditClient auditClient;

    public Map<String, Object> login(LoginRequestDTO request) {
        Map<String, Object> result = authClient.login(request);
        boolean ok = Boolean.TRUE.equals(result.get("success"));
        if (ok) {
            auditClient.log(null, "LOGIN", "Usuario",
                    "Inicio de sesión exitoso: " + request.email(),
                    request.email());
        }
        return result;
    }

    public Map<String, Object> register(RegisterRequestDTO request) {
        return authClient.register(request);
    }

    public Map<String, Object> me(String authorization){
        return authClient.me(authorization);
    }

    public Object getUsers(String authorization, String organizationId) {
        return authClient.getUsers(authorization, organizationId);
    }

    public Object getUserById(String authorization, String userId) {
        return authClient.getUserById(authorization, userId);
    }

    public Object assignRole(String authorization, String userId, Map<String, Object> body) {
        return authClient.assignRole(authorization, userId, body);
    }

    public Object getRoles(String authorization) {
        return authClient.getRoles(authorization);
    }

    public Object createRole(String authorization, Map<String, Object> body) {
        return authClient.createRole(authorization, body);
    }

    public Object getPermissions(String authorization) {
        return authClient.getPermissions(authorization);
    }

    public Object assignPermission(String authorization, String roleId, Map<String, Object> body) {
        return authClient.assignPermission(authorization, roleId, body);
    }

    public Object removePermission(String authorization, String roleId, String permissionId) {
        return authClient.removePermission(authorization, roleId, permissionId);
    }

    public Object activateAccount(String authorization, Map<String, Object> body) {
        return authClient.activateAccount(authorization, body);
    }

    public Object getAuditLogs(String authorization, String organizationId, int page, int size, String search) {
        return authClient.getAuditLogs(authorization, organizationId, page, size, search);
    }

    public Map<String, Object> forgotPassword(Map<String, Object> body) {
        return authClient.forgotPassword(body);
    }

    public Map<String, Object> resetPassword(Map<String, Object> body) {
        return authClient.resetPassword(body);
    }
}
