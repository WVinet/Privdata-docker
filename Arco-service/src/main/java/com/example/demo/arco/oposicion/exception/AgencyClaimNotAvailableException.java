package com.example.demo.arco.oposicion.exception;

public class AgencyClaimNotAvailableException extends RuntimeException {
    public AgencyClaimNotAvailableException() {
        super("El reclamo ante la Agencia solo está disponible cuando el estado es AGENCY_CLAIM_AVAILABLE");
    }
}
