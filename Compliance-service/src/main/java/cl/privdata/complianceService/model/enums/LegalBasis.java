package cl.privdata.complianceService.model.enums;

public enum LegalBasis {
    CONSENTIMIENTO,      // Art. 12 - titular otorga consentimiento
    CONTRATO,            // Art. 13 c) - ejecución de contrato con el titular
    OBLIGACION_LEGAL,    // Art. 13 b) - lo exige la ley
    INTERES_LEGITIMO,    // Art. 13 d) - interés legítimo del responsable
    INTERES_VITAL        // Art. 13 e) - proteger vida o integridad del titular
}
