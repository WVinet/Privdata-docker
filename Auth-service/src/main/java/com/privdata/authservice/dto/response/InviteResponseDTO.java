package com.privdata.authservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.UUID;

@Getter
@AllArgsConstructor
public class InviteResponseDTO {
    private UUID userId;
    private String email;
    private String temporaryPassword;
}
