# OPPOSITION_PROMPT

# PROMPT 2.0 — FLUJO COMPLETO DE SOLICITUD DE OPOSICIÓN
# Sistema: PrivData | Ley 21.719 Chile | Arco-service

---

## CONTEXTO DEL PROYECTO

Estás trabajando en el proyecto PrivData, una plataforma de cumplimiento de 
la Ley 21.719 de Protección de Datos Personales de Chile. Es una arquitectura 
de microservicios con las siguientes características:

- **Arco-service** en puerto 8082, base de datos `arco_db` (PostgreSQL)
- **Auth-service** en puerto 8080 — maneja JWT, roles y permisos
- **Organization-service** en puerto 8081 — tiene personas/titulares
- **Compliance-service** en puerto 8083 — tiene TreatmentActivity (RAT) 
  y bases de licitud
- **BFF** en puerto 8085 — proxy manual hacia los microservicios
- **Frontend** React/Vite en puerto 5173
- Java 21, Spring Boot, Spring Data JPA, Hibernate, Lombok, Maven
- Respuesta estándar: `ApiResponseDTO<T> { success, message, data }`
- Seguridad: `@PreAuthorize("hasAuthority('PERMISSION_NAME')")`
- El `organizationId` se obtiene del JWT, nunca del body del request
- El `dataSubjectId` se obtiene del JWT validado, nunca del body
- `ddl-auto=update` durante desarrollo

Lee el archivo CLAUDE.md del proyecto antes de comenzar. Respeta 
absolutamente toda la estructura y convenciones ya existentes.

---

## OBJETIVO

Implementar el flujo completo y legalmente correcto del derecho de oposición 
(Art. 8° Ley 21.719) en el Arco-service, estructurando el código de manera 
que sirva como base escalable para los demás derechos ARCO (supresión, 
rectificación, acceso, portabilidad).

---

## PARTE 1 — ESTRUCTURA DE CARPETAS

Reorganiza o crea el package del Arco-service con esta estructura. 
Si ya existen clases, muévelas respetando lo que ya funciona:
src/main/java/.../arco/
common/
model/
ArcoRequest.java          ← entidad base abstracta o tabla base
AuditLog.java             ← registro inmutable de cada acción
EvidenceFile.java         ← metadata de adjuntos (sin almacenamiento físico)
enums/
ArcoType.java             ← OPPOSITION, SUPPRESSION, RECTIFICATION,
ACCESS, PORTABILITY, BLOCK
RequestStatus.java        ← estados compartidos entre derechos
ActorType.java            ← TITULAR, REPRESENTATIVE, ANALYST,
DPO, SYSTEM, AGENCY
service/
DeadlineCalculatorService.java   ← cálculo de plazos
AuditService.java                ← registro de audit log
repository/
ArcoRequestRepository.java
AuditLogRepository.java
opposition/
model/
OppositionRequest.java          ← extiende o referencia ArcoRequest
OppositionDetail.java           ← detalle específico de oposición
TemporaryBlock.java             ← entidad propia con ciclo de vida
AgencyClaim.java                ← reclamo ante la Agencia
ThirdPartyNotification.java     ← notificación a cesionarios
enums/
OppositionCausal.java           ← 3 causales del Art. 8°
BlockStatus.java                ← estados del bloqueo temporal
ClaimCausal.java                ← 3 causales del reclamo
OppositionStatus.java           ← estados del flujo de oposición
service/
OppositionService.java
TemporaryBlockService.java
ThirdPartyNotificationService.java
controller/
OppositionController.java
dto/
request/
response/
repository/
OppositionRequestRepository.java
TemporaryBlockRepository.java
AgencyClaimRepository.java
ThirdPartyNotificationRepository.java

---

## PARTE 2 — ENUMS

### OppositionCausal.java
```java
public enum OppositionCausal {
    INTERES_LEGITIMO,       // Art. 8° a) — requiere fundamentación obligatoria
    MARKETING_DIRECTO,      // Art. 8° b) — derecho absoluto, irrechazable
    FUENTE_ACCESO_PUBLICO   // Art. 8° c) — procede si no hay otro fundamento legal
}
```

### OppositionStatus.java
Estados del flujo principal. Implementa exactamente estos:
RECEIVED                    → solicitud ingresada, acuse de recibo pendiente
IDENTITY_PENDING            → identidad no verificada aún
IDENTITY_VERIFIED           → identidad confirmada por Auth-service
ADMISSIBILITY_CHECK         → sistema validando si la solicitud procede legalmente
INADMISSIBLE                → solicitud rechazada antes de revisión (ver validaciones)
UNDER_REVIEW                → analista/DPO revisando
TEMPORARY_BLOCK_REQUESTED   → titular solicitó bloqueo temporal
TEMPORARY_BLOCK_APPROVED    → bloqueo activo, tratamiento congelado
TEMPORARY_BLOCK_REJECTED    → bloqueo rechazado, notificado a Agencia
EXTENDED                    → plazo prorrogado por 30 días corridos adicionales
ACCEPTED                    → oposición aceptada totalmente
PARTIALLY_ACCEPTED          → oposición aceptada parcialmente
REJECTED                    → oposición rechazada con fundamento obligatorio
NO_RESPONSE_EXPIRED         → vencimiento de plazo sin respuesta del responsable
AGENCY_CLAIM_AVAILABLE      → titular habilitado para reclamar ante Agencia
AGENCY_CLAIM_REGISTERED     → reclamo ante Agencia registrado en el sistema
AGENCY_SUSPENSION_ORDERED   → Agencia ordenó suspensión del tratamiento
THIRD_PARTY_NOTIFICATION_PENDING → aceptada, pendiente notificar cesionarios
THIRD_PARTY_NOTIFICATION_DONE    → cesionarios notificados
CLOSED                      → flujo cerrado

### BlockStatus.java
PENDING     → esperando respuesta del responsable (plazo: 2 días hábiles)
APPROVED    → bloqueo activo
REJECTED    → rechazado, responsable debe notificar a Agencia electrónicamente
EXPIRED     → venció plazo sin respuesta (equivale a aprobado por ley)

### ClaimCausal.java
TOTAL_REJECTION      → responsable rechazó totalmente la solicitud
PARTIAL_REJECTION    → responsable rechazó parcialmente
SILENCE_EXPIRED      → venció el plazo legal sin respuesta del responsable
BLOCK_REJECTION      → responsable rechazó el bloqueo temporal

---

## PARTE 3 — MODELO DE BASE DE DATOS

Crea estas tablas via entidades JPA. Todos los IDs son UUID generados por 
la base de datos. Incluye `created_at` y `updated_at` en todas las tablas.

### opposition_request
id                    UUID PK
organization_id       UUID NOT NULL
data_subject_id       UUID NOT NULL        ← Person.id del org-service
treatment_activity_id UUID                 ← RAT del compliance-service (nullable)
requester_name        VARCHAR NOT NULL
requester_rut         VARCHAR NOT NULL     ← para acreditar identidad
requester_email       VARCHAR NOT NULL
contact_address       VARCHAR              ← domicilio o email para notificar
representative_name   VARCHAR              ← si actúa por representante
representative_rut    VARCHAR
causal                VARCHAR NOT NULL     ← OppositionCausal enum
justification         TEXT                 ← OBLIGATORIO si causal=INTERES_LEGITIMO
opposed_treatment     TEXT NOT NULL        ← descripción del tratamiento específico
status                VARCHAR NOT NULL     ← OppositionStatus enum
submitted_at          TIMESTAMP NOT NULL
due_date              TIMESTAMP NOT NULL   ← submitted_at + 30 días CORRIDOS
extension_date        TIMESTAMP            ← si se prorroga, nueva fecha límite
extended              BOOLEAN DEFAULT FALSE
extended_at           TIMESTAMP
acknowledged_at       TIMESTAMP           ← fecha acuse de recibo
resolved_at           TIMESTAMP
resolution_grounds    TEXT                ← obligatorio si REJECTED o PARTIALLY_ACCEPTED
resolved_by_user_id   UUID
is_public_entity      BOOLEAN DEFAULT FALSE ← flag para futuro régimen Art. 23

### temporary_block
id                        UUID PK
opposition_request_id     UUID FK → opposition_request.id
justification             TEXT NOT NULL   ← bloqueo debe ser fundado
status                    VARCHAR NOT NULL ← BlockStatus enum
requested_at              TIMESTAMP NOT NULL
due_date                  TIMESTAMP NOT NULL  ← requested_at + 2 días HÁBILES
resolved_at               TIMESTAMP
resolution_grounds        TEXT
rejected_notified_agency  BOOLEAN DEFAULT FALSE  ← Art. 11: notificación a Agencia
rejected_notified_at      TIMESTAMP
resolved_by_user_id       UUID

### agency_claim
id                    UUID PK
opposition_request_id UUID FK → opposition_request.id
claim_causal          VARCHAR NOT NULL     ← ClaimCausal enum
impugned_decision     TEXT                 ← decisión impugnada o silencio
supporting_documents  TEXT                 ← referencia a documentos adjuntos
notification_channel  VARCHAR              ← medio para notificaciones
submitted_at          TIMESTAMP NOT NULL
agency_claim_deadline TIMESTAMP NOT NULL   ← submitted_at base + 30 días HÁBILES
status                VARCHAR NOT NULL     ← REGISTERED, IN_REVIEW, RESOLVED
agency_resolution     TEXT
suspension_ordered    BOOLEAN DEFAULT FALSE
suspension_ordered_at TIMESTAMP

### third_party_notification
id                    UUID PK
opposition_request_id UUID FK → opposition_request.id
third_party_name      VARCHAR NOT NULL
third_party_email     VARCHAR
notification_reason   TEXT NOT NULL
status                VARCHAR NOT NULL  ← PENDING, SENT, CONFIRMED, FAILED
created_at            TIMESTAMP NOT NULL
sent_at               TIMESTAMP
confirmed_at          TIMESTAMP

### evidence_file
id                    UUID PK
opposition_request_id UUID FK → opposition_request.id
file_name             VARCHAR NOT NULL
file_type             VARCHAR
file_size_bytes       BIGINT
storage_reference     VARCHAR   ← path o referencia futura, no almacenamiento real aún
uploaded_by_user_id   UUID
uploaded_at           TIMESTAMP NOT NULL

### arco_audit_log
id                    UUID PK
request_id            UUID NOT NULL       ← ID de la solicitud referenciada
arco_type             VARCHAR NOT NULL    ← ArcoType enum
actor_id              UUID                ← userId del actor
actor_type            VARCHAR NOT NULL    ← ActorType enum
action                VARCHAR NOT NULL    ← descripción de la acción
previous_status       VARCHAR
new_status            VARCHAR
reason                TEXT
ip_address            VARCHAR
created_at            TIMESTAMP NOT NULL  ← inmutable, nunca actualizar

---

## PARTE 4 — REGLAS DE NEGOCIO OBLIGATORIAS

Implementa estas reglas en OppositionService. Nunca saltarlas:

### 4.1 Validación de admisibilidad (ANTES de persistir)

Antes de crear la solicitud, el sistema debe ejecutar estas validaciones en orden:

**A) Validación de causal:**
- Si `causal = INTERES_LEGITIMO` y `justification` es null o vacío → 
  rechazar con error 400: "La causal de interés legítimo requiere fundamentación 
  (Art. 11 Ley 21.719)"

**B) Validación de excepción científica/estadística/histórica (Art. 8°):**
- Consultar el Compliance-service para obtener la finalidad del 
  `treatmentActivityId` si viene en el request
- Si la finalidad del tratamiento es `INVESTIGACION_CIENTIFICA`, 
  `ESTADISTICA`, o `HISTORICA` Y está vinculado a función pública o 
  interés público → crear la solicitud con estado `INADMISSIBLE` 
  inmediatamente, registrar en audit log con actor SYSTEM, y retornar 
  respuesta 200 con mensaje claro: "La solicitud de oposición no procede 
  porque el tratamiento se realiza con fines de investigación científica, 
  histórica o estadística vinculados a función pública (Art. 8° Ley 21.719). 
  Se ha registrado su solicitud y esta decisión."

**C) Validación de marketing directo:**
- Si `causal = MARKETING_DIRECTO`, marcar internamente como 
  `requiresMandatoryAcceptance = true`. Este campo no puede ser 
  rechazado por el responsable. Si el analista intenta rechazarlo, 
  el sistema debe lanzar una excepción con mensaje: 
  "El derecho de oposición por marketing directo es absoluto e irrechazable 
  (Art. 8° b) Ley 21.719)"

### 4.2 Cálculo de plazos — DeadlineCalculatorService

Implementa dos métodos separados y bien documentados:

```java
// Para plazo de respuesta del responsable: días CORRIDOS (calendario)
public LocalDateTime addCalendarDays(LocalDateTime from, int days)

// Para plazo de reclamo ante Agencia y bloqueo temporal: días HÁBILES
// Excluye sábados, domingos y feriados chilenos
public LocalDateTime addBusinessDays(LocalDateTime from, int days)
```

Para los feriados chilenos, crea una tabla `chilean_holiday` con los feriados 
del año actual seeded en DataInitializer. Incluye al menos los feriados fijos 
(1 enero, 1 mayo, 18 septiembre, 19 septiembre, 25 diciembre, etc.) más los 
variables del año corriente.

Plazos a calcular:
- `opposition_request.due_date` = `submitted_at` + 30 días CORRIDOS
- `opposition_request.extension_date` = `extended_at` + 30 días CORRIDOS (una sola vez)
- `temporary_block.due_date` = `requested_at` + 2 días HÁBILES
- `agency_claim.agency_claim_deadline` = `submitted_at` + 30 días HÁBILES

### 4.3 Bloqueo temporal — flujo completo

El bloqueo temporal es una entidad separada con su propio ciclo de vida:

- Cuando se crea un TemporaryBlock, el estado de la OppositionRequest 
  cambia a `TEMPORARY_BLOCK_REQUESTED`
- Mientras `TemporaryBlock.status = PENDING` o `APPROVED`, el sistema 
  NO debe permitir ninguna operación de tratamiento sobre los datos del 
  titular incluidos en el requerimiento. Implementa esto como un método 
  `isDataSubjectBlocked(dataSubjectId, treatmentActivityId)` en 
  TemporaryBlockService que retorna boolean
- Si el bloqueo se rechaza: `rejected_notified_agency = true` y registrar 
  timestamp. El responsable está obligado por ley a notificar 
  electrónicamente a la Agencia
- Si vence el plazo de 2 días hábiles sin respuesta: el sistema cambia 
  el estado a `EXPIRED` (equivale a APPROVED por omisión)

### 4.4 Prórroga

- Solo se puede prorrogar UNA vez (`extended = false` → `extended = true`)
- Si se intenta prorrogar una solicitud ya prorrogada → error 400
- Si la solicitud ya está vencida → error 400
- La prórroga agrega 30 días CORRIDOS a la fecha actual, no a la fecha 
  original

### 4.5 Resolución y notificación a terceros cesionarios

Cuando la solicitud pasa a `ACCEPTED` o `PARTIALLY_ACCEPTED`:

1. Marcar el tratamiento como no permitido para ese titular 
   (campo `oppositionActive` en la referencia al RAT)
2. Consultar al Compliance-service si existen cesiones registradas 
   para ese `dataSubjectId` y `treatmentActivityId`
3. Si hay cesionarios: crear registros `ThirdPartyNotification` con 
   status `PENDING` para cada uno y cambiar el estado de la solicitud 
   a `THIRD_PARTY_NOTIFICATION_PENDING`
4. Registrar en audit log con actorType `SYSTEM` cada notificación generada
5. Cuando todas las notificaciones pasen a `SENT` o `CONFIRMED`, cambiar 
   a `THIRD_PARTY_NOTIFICATION_DONE` y luego a `CLOSED`
6. Si no hay cesionarios: pasar directamente a `CLOSED`

### 4.6 Reclamo ante la Agencia — tres causales distintas

El reclamo se habilita automáticamente (estado `AGENCY_CLAIM_AVAILABLE`) en:
- Rechazo total → `ClaimCausal.TOTAL_REJECTION`
- Rechazo parcial → `ClaimCausal.PARTIAL_REJECTION`
- Silencio: cuando el scheduler detecta que `due_date` venció sin resolución 
  → estado `NO_RESPONSE_EXPIRED` → `AGENCY_CLAIM_AVAILABLE` con 
  `ClaimCausal.SILENCE_EXPIRED`
- Rechazo del bloqueo → `ClaimCausal.BLOCK_REJECTION`

El titular puede entonces registrar el reclamo via endpoint, que crea la 
entidad `AgencyClaim` con `agency_claim_deadline` = fecha actual + 30 
días HÁBILES.

### 4.7 Rechazo siempre debe tener fundamento

Si el analista/DPO intenta cambiar el estado a `REJECTED` o 
`PARTIALLY_ACCEPTED` sin `resolution_grounds` → error 400: 
"El rechazo total o parcial requiere fundamento legal obligatorio (Art. 11 
Ley 21.719)"

### 4.8 Scheduler — detección automática de vencimientos

Implementa un `@Scheduled` que corra cada hora y verifique:
- Solicitudes con `due_date < now()` y status no terminal → 
  cambiar a `NO_RESPONSE_EXPIRED` → `AGENCY_CLAIM_AVAILABLE`
- Bloqueos temporales con `due_date < now()` y status `PENDING` → 
  cambiar a `EXPIRED`

### 4.9 Organismos públicos — preparado para futuro

Agregar el campo `is_public_entity` en la entidad. Si viene `true` en el 
request, el sistema registra la solicitud pero agrega una nota en el 
audit log: "NOTA: El responsable es un organismo público. El flujo 
específico del Art. 23 Ley 21.719 (jefe superior del servicio, causales 
de rechazo por funciones fiscalizadoras) está preparado para implementación 
futura." No bloquear el flujo, solo documentarlo.

---

## PARTE 5 — ENDPOINTS REST

Implementa exactamente estos endpoints en OppositionController.
Todos requieren JWT válido. El `organizationId` siempre del token.
POST   /api/arco/opposition
→ Crear solicitud de oposición
→ @PreAuthorize("hasAuthority('ARCO_CREATE')")
→ Ejecuta validaciones de admisibilidad antes de persistir
→ Retorna acuse de recibo con ID y due_date
GET    /api/arco/opposition
→ Listar solicitudes (admin/analista ve todas, titular ve las suyas)
→ @PreAuthorize("hasAuthority('ARCO_VIEW')")
→ Filtros: status, causal, dataSubjectId, dateFrom, dateTo
GET    /api/arco/opposition/{id}
→ Detalle completo de una solicitud
PATCH  /api/arco/opposition/{id}/verify-identity
→ Cambiar estado a IDENTITY_VERIFIED
→ @PreAuthorize("hasAuthority('ARCO_RESOLVE')")
POST   /api/arco/opposition/{id}/temporary-block
→ Crear solicitud de bloqueo temporal
→ @PreAuthorize("hasAuthority('ARCO_CREATE')")
→ Body: { justification: string }
PATCH  /api/arco/opposition/{id}/temporary-block/{blockId}/resolve
→ Aprobar o rechazar el bloqueo
→ @PreAuthorize("hasAuthority('ARCO_RESOLVE')")
→ Body: { approved: boolean, grounds: string }
→ Si rejected: registrar rejected_notified_agency = true
PATCH  /api/arco/opposition/{id}/extend-deadline
→ Prorrogar plazo (una sola vez, 30 días corridos)
→ @PreAuthorize("hasAuthority('ARCO_RESOLVE')")
PATCH  /api/arco/opposition/{id}/resolve
→ Resolver la solicitud (ACCEPTED, PARTIALLY_ACCEPTED, REJECTED)
→ @PreAuthorize("hasAuthority('ARCO_RESOLVE')")
→ Body: { decision: string, grounds: string }
→ Valida grounds obligatorio para rechazo
→ Valida irrechazabilidad de MARKETING_DIRECTO
→ Dispara subflujo de terceros cesionarios si ACCEPTED/PARTIALLY_ACCEPTED
POST   /api/arco/opposition/{id}/agency-claim
→ Registrar reclamo ante la Agencia
→ @PreAuthorize("hasAuthority('ARCO_CREATE')")
→ Solo disponible si status = AGENCY_CLAIM_AVAILABLE
→ Body: { impugned_decision, supporting_documents, notification_channel }
PATCH  /api/arco/opposition/{id}/agency-suspension
→ Registrar suspensión ordenada por la Agencia
→ @PreAuthorize("hasAuthority('ARCO_RESOLVE')")
PATCH  /api/arco/opposition/{id}/third-party-notifications/{notificationId}
→ Actualizar estado de notificación a cesionario
→ @PreAuthorize("hasAuthority('ARCO_RESOLVE')")
GET    /api/arco/opposition/{id}/history
→ Historial de cambios de estado
GET    /api/arco/opposition/{id}/audit
→ Audit log completo de la solicitud
→ @PreAuthorize("hasAuthority('AUDIT_VIEW')")

---

## PARTE 6 — BFF

Para cada endpoint del Arco-service, agregar el método correspondiente en:
1. `OppositionClient.java` en el BFF (usando el helper `forward()`)
2. `OppositionBffService.java`
3. `OppositionBffController.java` con el mismo path bajo `/api/`
4. Siempre reenviar el header `Authorization`

---

## PARTE 7 — AUDIT LOG

Cada acción importante debe registrar en `arco_audit_log`:
- Creación de solicitud → actor: TITULAR/REPRESENTATIVE
- Verificación de identidad → actor: ANALYST
- Creación de bloqueo → actor: TITULAR
- Resolución de bloqueo → actor: ANALYST/DPO
- Prórroga → actor: ANALYST/DPO
- Cambio de estado → actor: quien lo ejecutó
- Vencimiento detectado → actor: SYSTEM
- Resolución final → actor: ANALYST/DPO
- Generación de notificaciones a terceros → actor: SYSTEM
- Registro de reclamo → actor: TITULAR
- Suspensión de Agencia → actor: SYSTEM/DPO

El audit log es INMUTABLE. Nunca actualizar registros existentes. 
Solo INSERT.

---

## PARTE 8 — MANEJO DE ERRORES

Implementar `@ControllerAdvice` con excepciones personalizadas:
OppositionNotFoundException           → 404
OppositionInadmissibleException       → 400 con motivo legal
MarketingDirectOppositionException    → 400 irrechazabilidad
GroundsRequiredException              → 400 fundamento obligatorio
DeadlineExpiredException              → 400 plazo vencido
ExtensionAlreadyAppliedException      → 400 prórroga duplicada
AgencyClaimNotAvailableException      → 400 estado no permite reclamo
DataSubjectBlockedException           → 409 datos bloqueados actualmente

---

## PARTE 9 — EJEMPLOS JSON

Genera ejemplos funcionales para probar con Postman/Swagger:

**A) Crear oposición por marketing directo:**
```json
{
  "dataSubjectId": "uuid-del-titular",
  "treatmentActivityId": "uuid-del-tratamiento",
  "requesterName": "María García López",
  "requesterRut": "12345678-9",
  "requesterEmail": "maria@ejemplo.com",
  "contactAddress": "maria@ejemplo.com",
  "causal": "MARKETING_DIRECTO",
  "justification": null,
  "opposedTreatment": "Envío de correos publicitarios y elaboración 
    de perfil de consumo"
}
```

**B) Crear oposición por interés legítimo:**
```json
{
  "causal": "INTERES_LEGITIMO",
  "justification": "El tratamiento afecta mis derechos fundamentales 
    porque...",
  "opposedTreatment": "Análisis de comportamiento de navegación para 
    segmentación comercial"
}
```

**C) Solicitar bloqueo temporal:**
```json
{
  "justification": "Solicito bloqueo inmediato mientras se resuelve 
    mi oposición al tratamiento de mis datos para elaboración de perfiles"
}
```

**D) Resolver aceptando:**
```json
{
  "decision": "ACCEPTED",
  "grounds": "Se acepta la oposición. El tratamiento cesa 
    desde esta fecha para todos los fines indicados."
}
```

**E) Resolver rechazando:**
```json
{
  "decision": "REJECTED",
  "grounds": "Se rechaza la oposición porque el tratamiento es 
    necesario para la defensa de reclamaciones contractuales 
    pendientes, lo que constituye motivo legítimo imperioso 
    conforme al Art. 8° a) Ley 21.719."
}
```

**F) Registrar reclamo ante la Agencia:**
```json
{
  "impugned_decision": "Rechazo notificado el 2026-05-01. 
    El responsable no acreditó motivos legítimos imperiosos.",
  "supporting_documents": "Correo de rechazo del responsable, 
    solicitud original",
  "notification_channel": "maria@ejemplo.com"
}
```

---

## INSTRUCCIONES FINALES PARA CLAUDE CODE

1. Lee CLAUDE.md primero y respeta toda la arquitectura existente
2. No rompas nada que ya funcione en el Arco-service
3. Implementa por partes en este orden:
   a) Enums y entidades JPA
   b) Repositorios
   c) DeadlineCalculatorService y AuditService
   d) OppositionService con todas las reglas de negocio
   e) TemporaryBlockService
   f) ThirdPartyNotificationService
   g) OppositionController
   h) Scheduler de vencimientos
   i) ControllerAdvice con excepciones
   j) BFF: client, service, controller
4. Usa los permisos existentes: ARCO_CREATE, ARCO_VIEW, ARCO_RESOLVE, AUDIT_VIEW
5. El organizationId siempre del JWT, nunca del body
6. El dataSubjectId siempre del JWT para el titular, del body solo si 
   lo registra un analista a nombre de un titular
7. Documenta con comentarios cada regla legal citando el artículo 
   correspondiente de la Ley 21.719
8. Genera el seed de feriados chilenos en DataInitializer
9. Configura Swagger/OpenAPI con descripción legal en cada endpoint