package com.example.demo.exception;

import java.util.UUID;

public class ArcoRequestNotFoundException extends RuntimeException {

    public ArcoRequestNotFoundException(UUID id) {
        super("Solicitud ARCO no encontrada con id: " + id);
    }
}
