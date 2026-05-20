package com.privdata.authservice.service;

import com.privdata.authservice.dto.request.LoginRequestDTO;
import com.privdata.authservice.dto.request.RegisterRequestDTO;
import com.privdata.authservice.dto.response.LoginResponseDTO;
import com.privdata.authservice.dto.response.MeResponseDTO;
import com.privdata.authservice.dto.response.RegisterResponseDTO;
import com.privdata.authservice.model.SecurityUser;

public interface AuthService {

    RegisterResponseDTO register(RegisterRequestDTO request);

    LoginResponseDTO login(LoginRequestDTO request);

    MeResponseDTO me(SecurityUser securityUser);

    void assignRoleToUser(java.util.UUID userId, String roleName);

}