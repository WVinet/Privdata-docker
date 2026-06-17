# Agencia-service — Contrato de Endpoints (Diseño)

> Estado: diseño, no implementado. Ver [01-resumen-y-flujo.md](01-resumen-y-flujo.md) para el contexto y [02-modelo-datos.md](02-modelo-datos.md) para las entidades referenciadas.

Convención de respuesta: `ApiResponseDTO<T>` (`{ success, message, data }`), igual que el resto de microservicios.

---

## 1. Arco-service — endpoints nuevos

### `POST /api/arco-request/{id}/reclamo-agencia`

El titular pide escalar su disconformidad ante la Agencia.

**Body:** ninguno — reusa el `motivo` ya guardado por `/disconformidad` (se busca la última entrada `[TITULAR DISCONFORME]` en `arco_request_status_history`).

**Precondiciones (400 si no se cumplen):**
- `status ∈ {RESPONDIDA, RECHAZADA}`
- `titularDisconforme == true`
- `agencyClaimId == null` (no se puede reclamar dos veces)
- `now() <= agencyClaimDeadline`

**Lógica interna:**
1. `OrganizationClient.findPersonById(organizationId, dataSubjectId)` → nombre/email/rut.
2. `AgenciaClient.crearReclamo(AgencyClaimCreateRequest)` → `AgencyClaimResponse`.
3. Guarda `arcoRequest.agencyClaimId = response.id()`.
4. Agrega entrada al historial: `[RECLAMO_AGENCIA] Reclamo registrado, ID: {id}`.

**Respuesta:** `200 OK`, `ApiResponseDTO<ArcoRequestResponseDTO>` (el DTO expone el nuevo campo `agencyClaimId`).

```json
{
  "success": true,
  "message": "Reclamo registrado ante la Agencia.",
  "data": { "...arcoRequest...": "...", "agencyClaimId": "uuid" }
}
```

### `PATCH /api/arco-request/{id}/respuesta-agencia`

Callback **server-to-server** (Agencia-service → Arco-service, sin pasar por BFF — mismo nivel de confianza que las llamadas Arco→Organization hoy, dentro de la red interna de docker-compose, sin auth).

**Body:**
```json
{
  "agencyClaimId": "uuid",
  "response": "string",
  "respondedAt": "2026-06-20T10:00:00"
}
```

**Lógica interna:** setea `agencyResolution`, `agencyRespondedAt`, `status=CERRADA`, `closedAt=now()`.

**Respuesta:** `200 OK`, `ApiResponseDTO<ArcoRequestResponseDTO>`.

---

## 2. Agencia-service — API propia (base `/api/agency-claims`)

Todos los endpoints (salvo que se indique lo contrario) requieren JWT válido con el rol/authority `AGENCY_AUDITOR` (`@PreAuthorize("hasAuthority('AGENCY_AUDITOR')")` o equivalente `hasRole(...)` — sin permisos finos).

### `POST /api/agency-claims` — crear (llamado por Arco-service, server-to-server)

```json
{
  "arcoRequestId": "uuid",
  "organizationId": "uuid",
  "dataSubjectId": "uuid",
  "dataSubjectName": "Juan Pérez",
  "dataSubjectEmail": "titular@privdata.cl",
  "dataSubjectRut": "12.345.678-9",
  "requestType": "CANCELLATION",
  "originalResolutionSummary": "string",
  "originalDenialLegalBasis": null,
  "claimReason": "string",
  "submittedAt": "2026-06-16T10:00:00"
}
```

Respuesta `201 Created`:
```json
{
  "success": true,
  "message": "Reclamo registrado",
  "data": {
    "id": "uuid",
    "arcoRequestId": "uuid",
    "status": "PENDIENTE",
    "dataSubjectName": "Juan Pérez",
    "requestType": "CANCELLATION",
    "claimReason": "string",
    "submittedAt": "2026-06-16T10:00:00",
    "createdAt": "2026-06-16T10:00:01"
  }
}
```

> Nota: este endpoint NO requiere el rol `AGENCY_AUDITOR` (lo llama Arco-service, no un humano logueado) — se protege solo por red interna, igual que otras llamadas service-to-service del sistema.

### `GET /api/agency-claims?status=PENDIENTE|RESPONDIDO&page=&size=` — listar

Alimenta el sidebar: `status=PENDIENTE` → panel "Reclamos"; `status=RESPONDIDO` → panel "Historial".

Respuesta: `ApiResponseDTO<Page<AgencyClaimResponseDTO>>`.

### `GET /api/agency-claims/{id}` — detalle

Mismo `AgencyClaimResponseDTO` completo (incluye `originalResolutionSummary`, `claimReason`, `agencyResponse` si ya fue respondido).

### `GET /api/agency-claims/arco-overview?organizationId=` — panel general de solicitudes

Proxy de solo lectura: internamente llama `GET {arco-service}/api/arco-request?organizationId=`. Alimenta el panel "todas las solicitudes ARCO" dentro de la vista "Reclamos" (split view).

Respuesta: passthrough del listado de Arco-service, envuelto en el propio `ApiResponseDTO` de Agencia-service.

### `PATCH /api/agency-claims/{id}/respond` — responder (acción del modal)

```json
{ "response": "string (obligatorio)" }
```

**Validación:** `status == PENDIENTE` (no se puede responder dos veces).

**Lógica interna (en este orden):**
1. Guarda `agencyResponse`, `status=RESPONDIDO`, `respondedAt=now()`, `respondedByUserId`/`respondedByEmail` (extraídos del JWT — claims `userId`/`sub`).
2. Envía email a `dataSubjectEmail` (EmailService propio, JavaMailSender + MailHog).
3. Llama `ArcoServiceClient.notificarRespuesta(...)` → `PATCH /api/arco-request/{arcoRequestId}/respuesta-agencia`. Best-effort: si falla, se loguea el error pero NO se revierte el paso 1 (sin transacciones distribuidas).

Respuesta: `ApiResponseDTO<AgencyClaimResponseDTO>` con el reclamo actualizado.

---

## 3. bff-api — espejo para el frontend nuevo

Nuevo `AgenciaClient` / `AgenciaBffService` / `AgenciaBffController` (mismo patrón que `ArcoClient`/`ArcoBffService`/`ArcoBffController`):

| Verbo | Path BFF | Reenvía a (downstream) |
|---|---|---|
| GET | `/api/agency-claims` | `GET agencia-service /api/agency-claims` |
| GET | `/api/agency-claims/{id}` | `GET agencia-service /api/agency-claims/{id}` |
| GET | `/api/agency-claims/arco-overview` | `GET agencia-service /api/agency-claims/arco-overview` |
| PATCH | `/api/agency-claims/{id}/respond` | `PATCH agencia-service /api/agency-claims/{id}/respond` |

Más, en el `ArcoBffController` existente:

| Verbo | Path BFF | Reenvía a (downstream) |
|---|---|---|
| POST | `/api/arco/{id}/reclamo-agencia` | `POST arco-service /api/arco-request/{id}/reclamo-agencia` |

El BFF sigue sin lógica de autorización propia — solo reenvía el header `Authorization`. La validación real del rol `AGENCY_AUDITOR` ocurre en Agencia-service (ver sección 2).

---

## 4. DTOs nuevos (resumen)

| DTO | Servicio | Campos |
|---|---|---|
| `AgencyClaimCreateRequest` | Arco-service → Agencia-service | ver body de `POST /api/agency-claims` |
| `AgencyClaimResponseDTO` | Agencia-service | `id, arcoRequestId, organizationId, dataSubjectId, dataSubjectName, dataSubjectEmail, dataSubjectRut, requestType, originalResolutionSummary, originalDenialLegalBasis, claimReason, status, agencyResponse, respondedByEmail, respondedAt, submittedAt, createdAt, updatedAt` |
| `AgencyClaimRespondRequest` | Frontend-Agencia → Agencia-service | `{ response: string }` |
| `ArcoAgencyCallbackRequest` | Agencia-service → Arco-service | `{ agencyClaimId, response, respondedAt }` |
