# Cambios implementados — ARCO-Service

## Contexto

El ARCO-Service es el microservicio encargado de gestionar las solicitudes de derechos ARCO (Acceso, Rectificación, Cancelación/Supresión, Oposición, Portabilidad y Bloqueo Temporal) según la Ley 21.719 de Protección de Datos Personales de Chile.

---

## 1. Enums corregidos

### `ArcoIdentityVerificationStatus`
**Ruta:** `enums/arcoRequest/ArcoIdentityVerificationStatus.java`

| Antes | Después |
|---|---|
| `ACCESS_ACCEPTED` | `PENDIENTE` |
| `ACCESS_DENIED` | `VERIFICADA` |
| — | `RECHAZADA` |

Los valores anteriores no correspondían al modelo de datos ni al flujo funcional definido para la verificación de identidad del titular.

---

## 2. Entidades corregidas

### `ArcoRequest`
**Ruta:** `model/ArcoRequest.java`

| Campo | Cambio |
|---|---|
| `assignedToUserId` | `nullable = false` → `nullable = true` (el modelo define `«REF, NULL»`) |
| `identityVerificationStatus` | Se agregó `@Enumerated(EnumType.STRING)` (faltaba, se guardaba como número en la BD) |
| `resolutionSummary` | Se agregó `columnDefinition = "TEXT"` |
| `createdAt` | Se agregó `updatable = false` para que Hibernate no lo modifique |
| `evidences`, `actions`, `statusHistory` | Se agregó `@JsonIgnore` en las tres colecciones para evitar bucle circular de serialización JSON y errores de `LazyInitializationException` |
| `evidences`, `actions`, `statusHistory` | Se agregó `cascade = CascadeType.ALL` |

### `ArcoRequestStatusHistory`
**Ruta:** `model/ArcoRequestStatusHistory.java`

| Campo | Cambio |
|---|---|
| `previousStatus` / `newStatus` | Tipo cambiado de `ArcoHistoryStatus` → `ArcoStatus` (ambos enums eran idénticos, se eliminó el duplicado) |
| `previousStatus` / `newStatus` | Se agregó `@Enumerated(EnumType.STRING)` en ambos (faltaba) |
| `changedByUserId` | `nullable = false` → `nullable = true` (el modelo define `«REF, NULL»`) |
| `changedAt` | Se cambió `@UpdateTimestamp` → `@CreationTimestamp` + `updatable = false` (un cambio de estado no se modifica) |
| `comment` | `nullable = false` → `nullable = true` (el comentario es opcional) |
| `arcoRequest` | Se agregó `@JsonIgnore` para evitar bucle circular al serializar |

### `ArcoRequestActions`
**Ruta:** `model/ArcoRequestActions.java`

| Campo | Cambio |
|---|---|
| `executedByUserId` | `nullable = false` → `nullable = true` (el modelo define `«REF, NULL»`) |
| `resultSummary` | `nullable = false` → `nullable = true` + `columnDefinition = "TEXT"` |
| `artifactUrl` | `nullable = false` → `nullable = true` + `length = 500` |
| `executedAt` | Se cambió a `@CreationTimestamp` + `updatable = false` |
| `arcoRequest` | Se agregó `@JsonIgnore` para evitar bucle circular al serializar |

### `ArcoRequestEvidences`
**Ruta:** `model/ArcoRequestEvidences.java`

| Campo | Cambio |
|---|---|
| `uploadedByUserId` | `nullable = false` → `nullable = true` (el modelo define `«REF, NULL»`) |
| `notes` | Nombre de columna `notas` → `notes` (corrección de consistencia) |
| `notes` | `nullable = false` → `nullable = true` + `columnDefinition = "TEXT"` |
| `uploadedAt` | Se cambió `@UpdateTimestamp` → `@CreationTimestamp` + `updatable = false` |
| `arcoRequest` | Se agregó `@JsonIgnore` para evitar bucle circular al serializar |

---

## 3. Archivos nuevos creados

### Utilidad

#### `BusinessDaysCalculator`
**Ruta:** `util/BusinessDaysCalculator.java`

Calcula la fecha límite (`due_date`) de respuesta sumando días hábiles reales (excluye sábados y domingos):

| Tipo de solicitud | Días hábiles |
|---|---|
| `BLOQUEO_TEMPORAL` | 2 días hábiles (plazo más urgente de la ley) |
| Todos los demás | 15 días hábiles |

### DTOs de entrada

#### `ArcoRequestCreateDTO`
**Ruta:** `dto/arcoRequest/ArcoRequestCreateDTO.java`

Campos requeridos para crear una solicitud: `organizationId`, `dataSubjectId`, `requestType`, `requestChannel`, `description`. El campo `assignedToUserId` es opcional.

#### `ArcoRequestStatusUpdateDTO`
**Ruta:** `dto/arcoRequest/ArcoRequestStatusUpdateDTO.java`

Campos para cambiar el estado: `newStatus` (requerido), `changedByUserId` y `comment` (opcionales).

#### `ArcoRequestEvidenceCreateDTO`
**Ruta:** `dto/arcoRequestEvidence/ArcoRequestEvidenceCreateDTO.java`

Campos para agregar una evidencia: `evidenceType`, `fileName`, `fileUrl`, `fileType` (todos requeridos). `uploadedByUserId` y `notes` son opcionales.

#### `ArcoRequestActionCreateDTO`
**Ruta:** `dto/arcoRequestAction/ArcoRequestActionCreateDTO.java`

Campos para registrar una acción: `actionType` (requerido). `executedByUserId`, `resultSummary` y `artifactUrl` son opcionales.

### Repositorios

#### `ArcoRequestActionsRepository` _(nuevo)_
**Ruta:** `repository/ArcoRequestActionsRepository.java`

Repositorio que faltaba para la entidad `ArcoRequestActions`. Incluye `findByArcoRequest_IdOrderByExecutedAtAsc`.

#### Repositorios actualizados con queries personalizadas

| Repositorio | Métodos agregados |
|---|---|
| `ArcoRequestRepository` | `findByOrganizationId`, `findByDataSubjectId`, `findByStatus`, `findByOrganizationIdAndStatus` |
| `ArcoRequestEvidencesRepository` | `findByArcoRequest_Id` |
| `ArcoRequestStatusHistoryRepository` | `findByArcoRequest_IdOrderByChangedAtAsc` |
| `ArcoRequestActionsRepository` | `findByArcoRequest_IdOrderByExecutedAtAsc` |

### Servicios

#### `ArcoRequestService` _(completado)_
**Ruta:** `service/ArcoRequestService.java`

| Método | Descripción |
|---|---|
| `listar()` | Devuelve todas las solicitudes |
| `buscarPorId(UUID)` | Busca por id, lanza `ArcoRequestNotFoundException` si no existe |
| `listarPorOrganizacion(UUID)` | Filtra por organización |
| `listarPorTitular(UUID)` | Filtra por titular de datos |
| `listarPorEstado(ArcoStatus)` | Filtra por estado |
| `crearSolicitud(DTO)` | Crea solicitud con estado `RECIBIDA`, verificación `PENDIENTE` y `due_date` calculado en días hábiles reales |
| `cambiarEstado(UUID, DTO)` | Cambia estado y **registra automáticamente** una entrada en `arco_request_status_history`. Si el nuevo estado es `RESPONDIDA` o `RECHAZADA`, registra `resolved_at` |
| `actualizarVerificacionIdentidad(UUID, status)` | Actualiza el estado de verificación de identidad |
| `actualizarResolucion(UUID, String)` | Guarda el resumen de resolución |

#### `ArcoRequestEvidencesService` _(implementado)_
**Ruta:** `service/ArcoRequestEvidencesService.java`

| Método | Descripción |
|---|---|
| `listarPorSolicitud(UUID)` | Lista evidencias de una solicitud |
| `agregarEvidencia(UUID, DTO)` | Asocia una nueva evidencia a la solicitud |
| `eliminarEvidencia(UUID)` | Elimina una evidencia por id |

#### `ArcoRequestStatusHistoryService` _(implementado)_
**Ruta:** `service/ArcoRequestStatusHistoryService.java`

| Método | Descripción |
|---|---|
| `historialPorSolicitud(UUID)` | Devuelve el historial de cambios de estado ordenado cronológicamente |

#### `ArcoRequestActionsService` _(nuevo)_
**Ruta:** `service/ArcoRequestActionsService.java`

| Método | Descripción |
|---|---|
| `listarPorSolicitud(UUID)` | Lista acciones ejecutadas sobre una solicitud |
| `registrarAccion(UUID, DTO)` | Registra una nueva acción sobre la solicitud |

### Controladores

#### `ArcoRequestController` _(completado)_
**Ruta:** `controller/ArcoRequestController.java`

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/arco-request` | Lista todas (soporta filtros `?organizationId=`, `?dataSubjectId=`, `?status=`) |
| `GET` | `/api/arco-request/{id}` | Busca por id |
| `POST` | `/api/arco-request` | Crea una nueva solicitud |
| `PATCH` | `/api/arco-request/{id}/estado` | Cambia estado (registra historial automáticamente) |
| `PATCH` | `/api/arco-request/{id}/verificacion-identidad` | Actualiza estado de verificación de identidad |
| `PATCH` | `/api/arco-request/{id}/resolucion` | Guarda resumen de resolución |

#### `ArcoRequestEvidencesController` _(nuevo)_
**Ruta:** `controller/ArcoRequestEvidencesController.java`

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/arco-request/{id}/evidencias` | Lista las evidencias de la solicitud |
| `POST` | `/api/arco-request/{id}/evidencias` | Agrega una nueva evidencia |
| `DELETE` | `/api/arco-request/{id}/evidencias/{evidenceId}` | Elimina una evidencia |

#### `ArcoRequestActionsController` _(nuevo)_
**Ruta:** `controller/ArcoRequestActionsController.java`

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/arco-request/{id}/acciones` | Lista las acciones de la solicitud |
| `POST` | `/api/arco-request/{id}/acciones` | Registra una nueva acción |

#### `ArcoRequestStatusHistoryController` _(nuevo)_
**Ruta:** `controller/ArcoRequestStatusHistoryController.java`

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/arco-request/{id}/historial` | Devuelve el historial de cambios de estado |

### Manejo de excepciones

#### `ArcoRequestNotFoundException`
**Ruta:** `exception/ArcoRequestNotFoundException.java`

Excepción de dominio lanzada cuando no se encuentra una solicitud por id. Produce respuesta HTTP `404 Not Found`.

#### `GlobalExceptionHandler`
**Ruta:** `exception/GlobalExceptionHandler.java`

Manejador centralizado de errores. Traduce excepciones a respuestas JSON estructuradas:

| Excepción | HTTP | Cuándo ocurre |
|---|---|---|
| `ArcoRequestNotFoundException` | `404` | Solicitud no encontrada por id |
| `MethodArgumentNotValidException` | `400` | Campos `@Valid` inválidos en el request body |
| `IllegalArgumentException` | `400` | Argumento de negocio inválido |
| `Exception` (genérica) | `500` | Error no esperado |

---

## 4. Configuración corregida

### `application.properties`

| Propiedad | Antes | Después |
|---|---|---|
| `spring.datasource.url` | `localhost:5432` | `localhost:5434` |

El postgres de arco corre en el puerto `5434` según el `docker-compose.yaml`. El puerto `5432` correspondía al postgres de auth-service, lo que impedía levantar el servicio localmente.

---

## 5. Flujo completo de una solicitud

```
POST /api/arco-request
  → status: RECIBIDA
  → identityVerificationStatus: PENDIENTE
  → due_date: +15 días hábiles (o +2 si es BLOQUEO_TEMPORAL)

PATCH /{id}/verificacion-identidad?nuevoEstado=VERIFICADA
  → identityVerificationStatus: VERIFICADA

PATCH /{id}/estado  { newStatus: "EN_REVISION" }
  → status: EN_REVISION
  → historial: registra RECIBIDA → EN_REVISION

PATCH /{id}/estado  { newStatus: "EN_GESTION" }
  → status: EN_GESTION
  → historial: registra EN_REVISION → EN_GESTION

POST /{id}/evidencias       → adjunta archivos
POST /{id}/acciones         → registra acciones ejecutadas

PATCH /{id}/estado  { newStatus: "RESPONDIDA" }
  → status: RESPONDIDA
  → resolved_at: (timestamp automático)
  → historial: registra EN_GESTION → RESPONDIDA

PATCH /{id}/resolucion?resolutionSummary=...
  → persiste el resumen de lo resuelto
```
