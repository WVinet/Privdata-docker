package com.example.demo.arco.opposition.exception;

import java.util.UUID;

public class OppositionNotFoundException extends RuntimeException {
    public OppositionNotFoundException(UUID id) {
        super("Solicitud de oposición no encontrada: " + id);
    }
}
