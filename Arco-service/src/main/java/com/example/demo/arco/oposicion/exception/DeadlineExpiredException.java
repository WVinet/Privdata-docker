package com.example.demo.arco.oposicion.exception;

public class DeadlineExpiredException extends RuntimeException {
    public DeadlineExpiredException(String message) {
        super(message);
    }
}
