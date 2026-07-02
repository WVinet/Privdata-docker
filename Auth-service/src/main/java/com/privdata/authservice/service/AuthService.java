package com.privdata.authservice.service;

import com.privdata.authservice.dto.request.ActivateAccountRequestDTO;
import com.privdata.authservice.dto.request.InviteRequestDTO;
import com.privdata.authservice.dto.request.LoginRequestDTO;
import com.privdata.authservice.dto.request.RegisterRequestDTO;
import com.privdata.authservice.dto.response.InviteResponseDTO;
import com.privdata.authservice.dto.response.LoginResponseDTO;
import com.privdata.authservice.dto.response.MeResponseDTO;
import com.privdata.authservice.dto.response.RegisterResponseDTO;
import com.privdata.authservice.dto.response.UserResponseDTO;
import com.privdata.authservice.model.SecurityUser;

import java.util.List;
import java.util.UUID;

public interface AuthService {

    RegisterResponseDTO register(RegisterRequestDTO request);

    InviteResponseDTO invite(InviteRequestDTO request);

    LoginResponseDTO login(LoginRequestDTO request);

    MeResponseDTO me(SecurityUser securityUser);

    LoginResponseDTO activateAccount(SecurityUser securityUser, ActivateAccountRequestDTO request);

    void assignRoleToUser(UUID userId, String roleName);

    List<UserResponseDTO> listUsers(UUID organizationId);

    UserResponseDTO getUserById(UUID userId);

    void updateEmailByPersonId(UUID personId, String newEmail);

    void disableByPersonId(UUID personId);

}