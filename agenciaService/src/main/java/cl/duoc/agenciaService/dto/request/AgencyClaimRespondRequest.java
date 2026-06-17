package cl.duoc.agenciaService.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AgencyClaimRespondRequest {

    @NotBlank(message = "La respuesta no puede estar vacía")
    private String response;
}
