package com.example.demo.arco.oposicion.enums;

public enum OppositionStatus {
    RECEIVED,                           // solicitud ingresada, acuse de recibo pendiente
    IDENTITY_PENDING,                   // identidad no verificada aún
    IDENTITY_VERIFIED,                  // identidad confirmada por Auth-service
    ADMISSIBILITY_CHECK,                // sistema validando si la solicitud procede legalmente
    INADMISSIBLE,                       // solicitud rechazada antes de revisión
    UNDER_REVIEW,                       // analista/DPO revisando
    TEMPORARY_BLOCK_REQUESTED,          // titular solicitó bloqueo temporal
    TEMPORARY_BLOCK_APPROVED,           // bloqueo activo, tratamiento congelado
    TEMPORARY_BLOCK_REJECTED,           // bloqueo rechazado, notificado a Agencia
    EXTENDED,                           // plazo prorrogado por 30 días corridos adicionales
    ACCEPTED,                           // oposición aceptada totalmente
    PARTIALLY_ACCEPTED,                 // oposición aceptada parcialmente
    REJECTED,                           // oposición rechazada con fundamento obligatorio
    NO_RESPONSE_EXPIRED,                // vencimiento de plazo sin respuesta del responsable
    AGENCY_CLAIM_AVAILABLE,             // titular habilitado para reclamar ante Agencia
    AGENCY_CLAIM_REGISTERED,            // reclamo ante Agencia registrado en el sistema
    AGENCY_SUSPENSION_ORDERED,          // Agencia ordenó suspensión del tratamiento
    THIRD_PARTY_NOTIFICATION_PENDING,   // aceptada, pendiente notificar cesionarios
    THIRD_PARTY_NOTIFICATION_DONE,      // cesionarios notificados
    CLOSED                              // flujo cerrado
}
