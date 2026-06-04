package cl.privdata.organizationService.dto.response;

import cl.privdata.organizationService.enums.DataStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PersonResponseDTO {

    private UUID id;
    private UUID organizationId;
    private UUID departmentId;
    private String departmentName;
    private String firstName;
    private String lastName;
    private String fullName;
    private String rut;
    private String email;
    private String phone;
    private String position;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean blocked;
    private Boolean anonymized;
    private Boolean deletionRequest;
    private DataStatus dataStatus;


}