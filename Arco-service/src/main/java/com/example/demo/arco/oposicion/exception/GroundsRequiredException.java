package com.example.demo.arco.oposicion.exception;

public class GroundsRequiredException extends RuntimeException {
    public GroundsRequiredException() {
        super("El rechazo total o parcial requiere fundamento legal obligatorio (Art. 11 Ley 21.719)");
    }
}
