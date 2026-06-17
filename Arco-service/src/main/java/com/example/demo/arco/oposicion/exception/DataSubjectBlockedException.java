package com.example.demo.arco.oposicion.exception;

import java.util.UUID;

public class DataSubjectBlockedException extends RuntimeException {
    public DataSubjectBlockedException(UUID dataSubjectId) {
        super("El titular " + dataSubjectId + " tiene un bloqueo temporal activo sobre el tratamiento indicado");
    }
}
