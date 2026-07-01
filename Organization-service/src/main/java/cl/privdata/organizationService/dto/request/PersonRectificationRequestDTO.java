package cl.privdata.organizationService.dto.request;

import lombok.Data;

@Data
public class PersonRectificationRequestDTO {
    private String firstName;
    private String secondName;
    private String lastName;
    private String maternalLastName;
    private String email;
    private String phone;
    private String position;
    private String rut;
}
