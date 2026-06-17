package com.example.demo.arco.oposicion.exception;

import java.util.UUID;

public class OppositionNotFoundException extends RuntimeException {
    public OppositionNotFoundException(UUID id) {
        super("Solicitud de oposición no encontrada: " + id);
    }
}
