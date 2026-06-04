package com.example.demo.arco.opposition.enums;

public enum BlockStatus {
    PENDING,    // esperando respuesta del responsable (plazo: 2 días hábiles)
    APPROVED,   // bloqueo activo
    REJECTED,   // rechazado, responsable debe notificar a Agencia electrónicamente
    EXPIRED     // venció plazo sin respuesta (equivale a aprobado por ley)
}
