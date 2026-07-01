package cl.privdata.complianceService.model.enums;

public enum TerceroTipo {
    ENCARGADO,              // Procesa datos por cuenta del responsable (ej. proveedor de email)
    CESIONARIO,             // Recibe datos para sus propios fines
    TERCERO_INDEPENDIENTE   // Acceso puntual sin relación continua
}
