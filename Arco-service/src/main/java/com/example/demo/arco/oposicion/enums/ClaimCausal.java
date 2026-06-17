package com.example.demo.arco.oposicion.enums;

public enum ClaimCausal {
    TOTAL_REJECTION,    // responsable rechazó totalmente la solicitud
    PARTIAL_REJECTION,  // responsable rechazó parcialmente
    SILENCE_EXPIRED,    // venció el plazo legal sin respuesta del responsable
    BLOCK_REJECTION     // responsable rechazó el bloqueo temporal
}
