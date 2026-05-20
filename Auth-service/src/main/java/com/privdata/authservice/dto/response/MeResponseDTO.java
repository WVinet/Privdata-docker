package com.privdata.authservice.dto.response;

import com.privdata.authservice.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
public class MeResponseDTO {
    private UUID id;
    private String email;
    private UUID organizationId;
    private UUID personId;
    private UserStatus status;
    private List<String> authorities;
}
