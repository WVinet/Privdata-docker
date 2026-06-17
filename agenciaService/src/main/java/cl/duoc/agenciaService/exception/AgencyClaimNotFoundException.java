package cl.duoc.agenciaService.exception;

import java.util.UUID;

public class AgencyClaimNotFoundException extends RuntimeException {

    public AgencyClaimNotFoundException(UUID id) {
        super("Reclamo no encontrado con id: " + id);
    }
}
