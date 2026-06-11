package com.example.demo.arco.opposition.exception;

public class ExtensionAlreadyAppliedException extends RuntimeException {
    public ExtensionAlreadyAppliedException() {
        super("La solicitud ya fue prorrogada. Solo se permite una prórroga (Art. 11 Ley 21.719)");
    }
}
