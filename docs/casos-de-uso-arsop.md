# Casos de Uso — Derechos ARSOP (Ley 21.719)

Este documento describe los casos de uso implementados en PrivData para el ejercicio de los derechos ARSOP (Acceso, Rectificación, Supresión, Oposición, Portabilidad) y las dos solicitudes adicionales del sistema (Bloqueo temporal, Anonimización), conforme a la Ley 21.719 sobre protección de datos personales en Chile.

Se basa en una revisión del código real (`Arco-service`, `bff-api`, `Frontend-Privdata`), no en la especificación teórica — por lo tanto incluye al final una sección de **hallazgos** donde la implementación no coincide del todo con lo que exige o sugiere la ley.

---

## 1. Flujo común a toda solicitud ARSOP

Todas las solicitudes comparten el mismo ciclo de estado (`ArcoStatus`):

```
RECIBIDA → EN_REVISION → EN_GESTION → RESPONDIDA / RECHAZADA → (CERRADA, si hay reclamo ante la Agencia)
```

- **RECIBIDA**: el titular envía la solicitud desde el portal (`TitularArco.tsx`). Se calcula `dueDate` (plazo legal) y se notifica por correo al titular (Art. 11).
- **EN_REVISION**: se marca automáticamente apenas un administrador abre la solicitud en el panel (`ArcoPage.tsx`), antes de cualquier acción manual. Queda registrada `reviewStartedAt` y se notifica por correo.
- **EN_GESTION**: se alcanza al verificar la identidad del titular (`verifyIdentity`, distinto por cada flujo). Si la identidad es rechazada, la solicitud pasa directo a `RECHAZADA`.
- **RESPONDIDA / RECHAZADA**: resolución final del responsable, con `resolutionSummary` obligatorio (Art. 11) y, si corresponde, `denialLegalBasis` (Art. 5°) cuando se rechaza vía el endpoint genérico de cambio de estado.
- **RECLAMADA_AGENCIA / CERRADA**: si el titular queda disconforme con la resolución, puede escalar el reclamo a la Agencia (`reclamarAnteAgencia`), que se cierra cuando esta responde (`registrarRespuestaAgencia`).

Cada transición relevante dispara un correo (MailHog en desarrollo) con el formato `Tu solicitud: <UUID>, Motivo: <tipo>, se encuentra en <estado>`.

---

## 2. Resumen por derecho

| Derecho | Art. Ley 21.719 | Plazo declarado en UI | Plazo realmente calculado | Causales soportadas | Efecto al aprobar |
|---|---|---|---|---|---|
| Acceso | Art. 9 | 30 días corridos | 30 días corridos ✅ | — (sin causal, solo descripción) | Solo lectura: compone reporte desde `organization-service` |
| Rectificación | Art. 10 | 30 días corridos | 30 días corridos ✅ | — (datos nuevos directamente en el formulario) | `organizationClient.rectificationDataSubject(...)` |
| Supresión | Art. 10 | 30 días corridos | **2 días hábiles** ⚠️ (ver hallazgo 1) | `DATA_NOT_NECESSARY`, `CONSENT_REVOKED`, `DATA_EXPIRED` | `organizationClient.deleteDataSubject(...)` |
| Oposición | Art. 8 | 30 días corridos | 30 días corridos ✅ | `LEGITIMATE_INTEREST`, `DIRECT_MARKETING`, `PUBLIC_SOURCE` | `organizationClient.restrictProcessing(...)` |
| Portabilidad | Art. 10 bis (equivalente) | 30 días corridos | 30 días corridos ✅ | `USER_REQUEST`, `TRANSFER_TO_OTHER_PROVIDER`, `PERSONAL_BACKUP` | Genera JSON descargable, sin mutar datos |
| Bloqueo temporal | Art. 10 (medida cautelar) | 2 días hábiles | 2 días hábiles ✅ | `PROCESSING_UNDER_CHALLENGE`, `UNLAWFUL_PROCESSING`, `PENDING_SUPPRESSION_REVIEW` | `organizationClient.blockPerson(...)` |
| Anonimización | Art. 10 (solicitud adicional, no ARCO estricto) | 30 días corridos | 30 días corridos ✅ | `DATA_NO_LONGER_REQUIRES_IDENTIFICATION`, `PRIVACY_PRESERVING_RETENTION`, `STATISTICAL_OR_RESEARCH_PURPOSE` | `organizationClient.anonymizePerson(...)` |

---

## 3. Casos de uso por derecho

### 3.1 Acceso (Art. 9)

**CU-ACC-01 — Titular solicita conocer sus datos**
- Actor: Titular autenticado en el portal.
- Flujo: crea solicitud de Acceso → admin verifica identidad → admin responde con el reporte generado desde `organization-service` (nombre, email, etc.) → estado `RESPONDIDA`.
- Resultado: el titular ve en su seguimiento (`TitularSeguimiento.tsx`) los datos que la organización tiene registrados sobre él.

**CU-ACC-02 — Titular excede el límite de solicitudes**
- Regla de negocio implementada: máximo 3 solicitudes de Acceso por titular cada 30 días (`access.max-requests` / `access.period-days`, configurable por entorno).
- Flujo: al crear la 4ª solicitud dentro de la ventana de 30 días, el sistema la crea directamente en estado `RECHAZADA` con el motivo "Solicitud rechazada por exceso de solicitudes de acceso", sin pasar por revisión ni gestión.
- Resultado: protege contra abuso del derecho de acceso (uso indebido / DoS funcional), aunque la ley no fija explícitamente este límite — es una política interna razonable.

**CU-ACC-03 — Identidad no verificable**
- Flujo: admin rechaza la verificación de identidad → estado pasa a `RECHAZADA` directamente, con `agencyClaimDeadline` calculado para que el titular pueda reclamar si no está de acuerdo.

---

### 3.2 Rectificación (Art. 10)

**CU-REC-01 — Corrección de datos desactualizados**
- Actor: Titular.
- Flujo: el titular indica los campos a corregir (nombre, RUT, email, teléfono, cargo) al crear la solicitud → admin verifica identidad → admin aprueba → se llama `organizationClient.rectificationDataSubject(...)`, que actualiza el registro real en `organization-service`.
- Resultado: los datos quedan corregidos y el titular recibe confirmación por correo.

**CU-REC-02 — Solicitud sin datos nuevos**
- Detalle técnico: `crear(dto)` (sin `PersonRectificationRequestDTO`) crea una solicitud con un DTO de rectificación vacío. Permite registrar la intención aunque el detalle de qué corregir se recoja después, por ejemplo vía un canal no-portal (Art. 11, canal presencial/correo).

---

### 3.3 Supresión (Art. 10)

**CU-SUP-01 — Datos ya no necesarios para la finalidad original**
- Causal: `DATA_NOT_NECESSARY`.
- Flujo: admin evalúa `dataStillNecessary` → si es `false`, aprueba y se ejecuta `organizationClient.deleteDataSubject(...)`.
- Resultado: eliminación lógica del titular en `organization-service`.

**CU-SUP-02 — Revocación de consentimiento sin otra base legal**
- Causal: `CONSENT_REVOKED`.
- Flujo: admin evalúa `anotherLegalBasisExists` → si no existe otra base legal (p. ej. contrato vigente), se aprueba la supresión.
- Resultado: coherente con el modelo de `Consent`/`ConsentEvent` de `compliance-service` — la revocación de consentimiento debería, en la práctica, originar también una solicitud de Supresión si no queda otra base legal.

**CU-SUP-03 — Rechazo por excepción legal (retención obligatoria)**
- Flujo: admin marca `exceptionApplies = true` (p. ej. obligación tributaria/laboral de conservar el dato) → solicitud `RECHAZADA` con motivo automático.

---

### 3.4 Oposición (Art. 8)

**CU-OPO-01 — Oposición a marketing directo**
- Causal: `DIRECT_MARKETING`.
- Flujo: titular selecciona la causal y la actividad de tratamiento (RAT) a la que se opone, ej. "Marketing y comunicaciones personalizadas" → admin verifica identidad → admin aprueba → `organizationClient.restrictProcessing(orgId, dataSubjectId, treatmentActivityId, processingPurpose)`.
- Resultado: el titular deja de recibir comunicaciones para esa finalidad específica. Este es el caso de uso **mejor cubierto** porque el derecho de oposición al marketing directo es prácticamente incondicional en la ley — no requiere acreditar motivos imperiosos del responsable.

**CU-OPO-02 — Oposición por interés legítimo, rechazada por motivos imperiosos**
- Causal: `LEGITIMATE_INTEREST`.
- Flujo: admin marca `overridingLegitimateGrounds = true` → solicitud `RECHAZADA` con motivo "existen motivos legítimos imperiosos para continuar el tratamiento".
- Resultado: refleja correctamente la lógica del Art. 8 — el responsable puede continuar el tratamiento si demuestra motivos legítimos imperiosos que prevalecen sobre el interés del titular.

**CU-OPO-03 — Oposición a datos de fuente pública**
- Causal: `PUBLIC_SOURCE`.
- Caso: el titular se opone a que sus datos, obtenidos de una fuente de acceso público, sigan tratándose para una finalidad determinada.

⚠️ Ver **Hallazgo 2** — actualmente ninguna actividad de tratamiento (RAT) sembrada en el sistema tiene `legalBasis = INTERES_LEGITIMO`, por lo que `CU-OPO-02` y `CU-OPO-03` no tienen, hoy, ninguna finalidad real contra la cual probarse en el entorno de desarrollo.

---

### 3.5 Portabilidad (derecho derivado, Art. 10/transparencia)

**CU-POR-01 — Titular solicita copia portable de sus datos**
- Causal: `PERSONAL_BACKUP`.
- Flujo: admin aprueba → se genera un archivo JSON (`portability-<personId>.json`) con los datos del titular desde `organization-service`, descargable vía `GET /api/arso/portability/{id}/download`.

**CU-POR-02 — Transferencia a otro responsable de tratamiento**
- Causal: `TRANSFER_TO_OTHER_PROVIDER`.
- Campo adicional: `destinationOrganization` (a qué organización se transfieren los datos).
- Nota: el sistema solo genera el archivo descargable; **no transmite automáticamente** los datos al tercero — es responsabilidad operativa del equipo que gestiona la solicitud.

---

### 3.6 Bloqueo temporal (medida cautelar, no es un derecho ARSOP per se)

**CU-BLO-01 — Bloqueo mientras se resuelve una impugnación**
- Causal: `PROCESSING_UNDER_CHALLENGE`.
- Caso: el titular impugna la exactitud de sus datos (paralelo a una Rectificación en curso) y pide que se bloquee el tratamiento mientras se resuelve.
- Plazo: 2 días hábiles — coherente con la naturaleza cautelar/urgente de la medida.

**CU-BLO-02 — Tratamiento ilícito detectado**
- Causal: `UNLAWFUL_PROCESSING`.
- Resultado al aprobar: `organizationClient.blockPerson(...)` restringe el tratamiento de forma inmediata.

**CU-BLO-03 — Bloqueo previo a una Supresión**
- Causal: `PENDING_SUPPRESSION_REVIEW`.
- Caso: se bloquea el dato como paso intermedio mientras se evalúa una solicitud de Supresión paralela, evitando que se siga tratando mientras se decide si se elimina.

---

### 3.7 Anonimización (solicitud adicional)

**CU-ANO-01 — Dato ya no requiere identificación**
- Causal: `DATA_NO_LONGER_REQUIRES_IDENTIFICATION`.
- Flujo: admin aprueba → `organizationClient.anonymizePerson(...)` — los campos identificables se reemplazan por valores no atribuibles, sin eliminar el registro completo (a diferencia de Supresión).

**CU-ANO-02 — Conservación con fines estadísticos**
- Causal: `STATISTICAL_OR_RESEARCH_PURPOSE`.
- Caso: el titular pide dejar de ser identificable, pero la organización igual conserva el dato anonimizado con fines estadísticos/de investigación — escenario típico donde Anonimización es preferible a Supresión.

---

## 4. Hallazgos de la revisión

### Hallazgo 1 — Plazo de Supresión mal calculado (bug)

`BusinessDaysCalculator.calcularFechaLimite` agrupa `SUPRESION` en el mismo `case` que `BLOQUEO_TEMPORAL`:

```java
case SUPRESION:
case BLOQUEO_TEMPORAL:
    return agregarDiasHabiles(inicio, 2);
```

Pero el frontend (`TitularArco.tsx`) declara `"Supresión" → "30 días corridos"`. Es decir, **toda solicitud de Supresión recibe hoy un `dueDate` de 2 días hábiles**, no de 30 días corridos como se le promete al titular en la UI. Esto afecta directamente el cálculo del plazo legal (Art. 11) y el plazo para reclamar ante la Agencia.

**Recomendación:** mover `SUPRESION` al `case` por defecto (30 días corridos), dejando `BLOQUEO_TEMPORAL` como el único caso de 2 días hábiles, que sí es coherente con su naturaleza de medida cautelar urgente. Puedo aplicar este fix si quieres.

### Hallazgo 2 — Finalidades de Oposición no validadas contra la causal legal

En el formulario de Oposición, la lista de "finalidades" mostradas (`treatmentActivities`) viene del RAT (`TreatmentActivity.purpose`) y es independiente de la "Causal de la oposición" seleccionada. Hoy existen dos actividades sembradas (`DemoDataSeeder.java`):

| Finalidad (RAT) | `legalBasis` | Causal de oposición compatible (Art. 8) |
|---|---|---|
| Gestión de relación con clientes | `CONTRATO` | Ninguna — el tratamiento necesario para ejecutar un contrato normalmente **no es opo­nible** vía Art. 8; el titular no puede oponerse a un tratamiento contractualmente necesario, solo terminar el contrato. |
| Marketing y comunicaciones personalizadas | `CONSENTIMIENTO` | `DIRECT_MARKETING` ✅ (la oposición a marketing directo es válida independiente de la base legal) |

El sistema permite que un titular elija la causal `LEGITIMATE_INTEREST` o `PUBLIC_SOURCE` y la finalidad "Gestión de relación con clientes" (base `CONTRATO`), una combinación que legalmente debería rechazarse casi siempre, pero el formulario no lo advierte ni el backend lo valida — queda enteramente a criterio del admin al resolver.

**Recomendación:**
- Mostrar el `legalBasis` de cada actividad junto a su nombre en el selector de finalidades, para que el titular y el admin vean la coherencia antes de enviar/resolver.
- Opcional: filtrar las finalidades disponibles según la causal elegida (p. ej. solo mostrar actividades con `legalBasis IN (INTERES_LEGITIMO)` cuando la causal es `LEGITIMATE_INTEREST`).

### Hallazgo 3 — Código muerto de "cancelación" con submecanismos (Bloqueo/Eliminación/Anonimización)

`ArcoRequestService.crearSolicitudCancelacion` / `ejecutarCancelacion` implementan un flujo alternativo de Supresión con tres submecanismos (`BLOCK`, `DELETE`, `ANONYMIZE`) elegibles por `cancellationActionType`. **No está conectado al frontend** (`api.ts` no expone ningún endpoint hacia él) — el flujo de Supresión realmente usado es `SupresionService`, que siempre ejecuta `deleteDataSubject` sin opción de elegir el mecanismo. Si no es un trabajo en curso, vale la pena eliminarlo para no mantener dos implementaciones divergentes del mismo derecho.

---

## 5. Siguientes pasos sugeridos

1. Corregir el plazo de Supresión (Hallazgo 1) — cambio de una línea, alto impacto legal.
2. Decidir si se filtra/valida la combinación causal–finalidad en Oposición (Hallazgo 2), o si se deja a criterio manual del admin pero con más contexto visible.
3. Confirmar si el flujo de cancelación con submecanismos (Hallazgo 3) sigue vigente o se puede eliminar.
