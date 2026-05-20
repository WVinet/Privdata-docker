package com.privdata.authservice.dto.response;

import com.privdata.authservice.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RegisterResponseDTO {

    private UUID id;
    private String email;
    private UserStatus status;
    private UUID organizationId;
    private UUID personId;
}