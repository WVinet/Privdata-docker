package com.example.demo.arco.opposition.exception;

public class DeadlineExpiredException extends RuntimeException {
    public DeadlineExpiredException(String message) {
        super(message);
    }
}
