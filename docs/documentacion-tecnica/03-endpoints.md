# Catálogo de Endpoints REST — PrivData

Convenciones:
- Todos los microservicios devuelven `ApiResponseDTO<T>` con forma `{ success: boolean, message: string, data: T }`, salvo donde se indique lo contrario.
- `bff-api` (`:8085`) es el único punto de entrada del frontend (vía proxy `/api`). No tiene lógica de autorización propia: reenvía el header `Authorization`.
- Permiso `Ninguno` no significa "público": en varios casos la seguridad se aplica en el microservicio destino o el endpoint es de uso interno/orquestación.

---

## 1. Auth-service (`:8080`)

### AuthController — base `/api/auth`

| Verbo | Path | Permiso | Entrada | Respuesta | Descripción |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | `USER_CREATE` | `RegisterRequestDTO` | `ApiResponseDTO<RegisterResponseDTO>` | Registrar nuevo usuario |
| GET | `/api/auth/users` | `USER_VIEW` | `organizationId?` | `ApiResponseDTO<List<UserResponseDTO>>` | Listar usuarios (filtrable por organización) |
| GET | `/api/auth/users/{userId}` | `USER_VIEW` | `userId: UUID` | `ApiResponseDTO<UserResponseDTO>` | Obtener usuario por ID |
| POST | `/api/auth/invite` | `USER_CREATE` | `InviteRequestDTO` | `ApiResponseDTO<InviteResponseDTO>` | Crear invitación de usuario (estado `PENDING`) |
| POST | `/api/auth/login` | — | `LoginRequestDTO` | `ApiResponseDTO<LoginResponseDTO>` | Iniciar sesión, retorna JWT |
| GET | `/api/auth/me` | — | `Authentication` (JWT) | `ApiResponseDTO<MeResponseDTO>` | Perfil del usuario autenticado |
| POST | `/api/auth/me/activate` | — | `ActivateAccountRequestDTO` | `ApiResponseDTO<LoginResponseDTO>` | Activar cuenta / definir contraseña inicial |
| POST | `/api/auth/users/{userId}/roles` | `ROLE_ASSIGN` | `userId`, `AssignRoleRequestDTO` | `ApiResponseDTO<Void>` | Asignar rol a un usuario |

### AuditLogController — base `/api/auth/audit`

| Verbo | Path | Permiso | Entrada | Respuesta | Descripción |
|---|---|---|---|---|---|
| POST | `/api/auth/audit` | — | `AuditLogRequest` | `Void` | Registrar evento de auditoría (uso interno entre servicios) |
| GET | `/api/auth/audit` | — | `organizationId`, `page`, `size` | `ApiResponseDTO<Page<AuditLogResponse>>` | Listar eventos de auditoría paginados |

### PasswordResetController — base `/api/auth/password`

| Verbo | Path | Permiso | Entrada | Respuesta | Descripción |
|---|---|---|---|---|---|
| POST | `/api/auth/password/forgot` | — | `ForgotPasswordRequest` | `ApiResponseDTO<Void>` | Solicitar código de restablecimiento de contraseña |
| POST | `/api/auth/password/reset` | — | `ResetPasswordRequest` | `ApiResponseDTO<Void>` | Restablecer contraseña con código |

### NotificationController — base `/api/auth/notifications`

| Verbo | Path | Permiso | Entrada | Respuesta | Descripción |
|---|---|---|---|---|---|
| POST | `/api/auth/notifications/arco-resolution` | — | `ArcoNotificationRequestDTO` | `ApiResponseDTO<Void>` | Enviar notificación de resolución de una solicitud ARCO |

### HealthController / TestSecurityController

| Verbo | Path | Permiso | Respuesta | Descripción |
|---|---|---|---|---|
| GET | `/api/health` | — | `String` | Health check del servicio |
| GET | `/test/arco-view` | `ARCO_VIEW` | `ApiResponseDTO<String>` | Prueba de permiso ARCO_VIEW |
| GET | `/test/arco-create` | `ARCO_CREATE` | `ApiResponseDTO<String>` | Prueba de permiso ARCO_CREATE |
| GET | `/test/user-create` | `USER_CREATE` | `ApiResponseDTO<String>` | Prueba de permiso USER_CREATE |

---

## 2. Organization-service (`:8081`)

### OrganizationController — base `/api/organizations`

| Verbo | Path | Entrada | Respuesta | Descripción |
|---|---|---|---|---|
| POST | `/api/organizations` | `OrganizationCreateRequestDTO` | `ApiResponseDTO<OrganizationResponseDTO>` | Crear organización |
| GET | `/api/organizations` | — | `ApiResponseDTO<List<OrganizationResponseDTO>>` | Listar organizaciones |
| GET | `/api/organizations/{organizationId}` | `organizationId: UUID` | `ApiResponseDTO<OrganizationResponseDTO>` | Obtener organización |
| PUT | `/api/organizations/{organizationId}` | `OrganizationUpdateRequestDTO` | `ApiResponseDTO<OrganizationResponseDTO>` | Actualizar organización |
| PATCH | `/api/organizations/{organizationId}/status` | `OrganizationStatusUpdateRequestDTO` | `ApiResponseDTO<OrganizationResponseDTO>` | Activar/desactivar organización |

### DepartmentController — base `/api/organizations/{organizationId}/departments`

| Verbo | Path | Entrada | Respuesta | Descripción |
|---|---|---|---|---|
| POST | `/.../departments` | `DepartmentCreateRequestDTO` | `ApiResponseDTO<DepartmentResponseDTO>` | Crear departamento |
| GET | `/.../departments` | `active?` | `ApiResponseDTO<List<DepartmentResponseDTO>>` | Listar departamentos |
| GET | `/.../departments/{departmentId}` | `departmentId: UUID` | `ApiResponseDTO<DepartmentResponseDTO>` | Obtener departamento |
| PUT | `/.../departments/{departmentId}` | `DepartmentUpdateRequestDTO` | `ApiResponseDTO<DepartmentResponseDTO>` | Actualizar departamento |
| PATCH | `/.../departments/{departmentId}/status` | `DepartmentStatusUpdateRequestDTO` | `ApiResponseDTO<DepartmentResponseDTO>` | Activar/desactivar departamento |

### PersonController — base `/api/organizations/{organizationId}/persons`

| Verbo | Path | Entrada | Respuesta | Descripción |
|---|---|---|---|---|
| POST | `/.../persons` | `PersonCreateRequestDTO` | `ApiResponseDTO<PersonResponseDTO>` | Crear persona |
| GET | `/.../persons` | `departmentId?`, `active?` | `ApiResponseDTO<List<PersonResponseDTO>>` | Listar personas |
| GET | `/.../persons/{personId}` | `personId: UUID` | `ApiResponseDTO<PersonResponseDTO>` | Obtener persona |
| PUT | `/.../persons/{personId}` | `PersonUpdateRequestDTO` | `ApiResponseDTO<PersonResponseDTO>` | Actualizar persona |
| PATCH | `/.../persons/{personId}/status` | `PersonStatusUpdateRequestDTO` | `ApiResponseDTO<PersonResponseDTO>` | Activar/desactivar persona |
| POST | `/.../persons/{personId}/block` | `personId: UUID` | `ApiResponseDTO<?>` | Bloquear datos del titular (derecho cancelación) |
| POST | `/.../persons/{personId}/delete` | `personId: UUID` | `ApiResponseDTO<?>` | Eliminar (lógicamente) datos del titular (derecho supresión) |
| POST | `/.../persons/{personId}/anonymize` | `personId: UUID` | `ApiResponseDTO<?>` | Anonimizar datos del titular (derecho al olvido) |

### OrganizationSettingsController — base `/api/organizations/{organizationId}/settings`

| Verbo | Path | Entrada | Respuesta | Descripción |
|---|---|---|---|---|
| POST | `/.../settings` | `OrganizationSettingsCreateRequestDTO` | `ApiResponseDTO<OrganizationSettingsResponseDTO>` | Crear configuración |
| GET | `/.../settings` | — | `ApiResponseDTO<OrganizationSettingsResponseDTO>` | Obtener configuración |
| PUT | `/.../settings` | `OrganizationSettingsUpdateRequestDTO` | `ApiResponseDTO<OrganizationSettingsResponseDTO>` | Actualizar configuración |

### HealthController

| Verbo | Path | Respuesta | Descripción |
|---|---|---|---|
| GET | `/api/health` | `String` | Health check del servicio |

---

## 3. Arco-service (`:8082`)

### ArcoRequestController — base `/api/arco-request`

| Verbo | Path | Entrada | Respuesta | Descripción |
|---|---|---|---|---|
| GET | `/api/arco-request` | `organizationId?`, `dataSubjectId?`, `status?` | `ApiResponseDTO<List<ArcoRequestResponseDTO>>` | Listar solicitudes ARCO con filtros |
| GET | `/api/arco-request/by-subject/{dataSubjectId}` | `dataSubjectId: UUID` | `ApiResponseDTO<List<ArcoRequestResponseDTO>>` | Solicitudes de un titular |
| GET | `/api/arco-request/{id}` | `id: UUID` | `ApiResponseDTO<ArcoRequestResponseDTO>` | Obtener solicitud por ID |
| POST | `/api/arco-request` | `ArcoRequestCreateDTO` | `ApiResponseDTO<ArcoRequestResponseDTO>` | Crear solicitud ARCO (`dueDate = ahora + 30 días`) |
| PATCH | `/api/arco-request/{id}/estado` | `ArcoRequestStatusUpdateDTO` | `ApiResponseDTO<ArcoRequestResponseDTO>` | Cambiar estado de la solicitud |
| PATCH | `/api/arco-request/{id}/prorroga` | `id: UUID` | `ApiResponseDTO<ArcoRequestResponseDTO>` | Otorgar prórroga de 30 días (Art. 11) |
| PATCH | `/api/arco-request/{id}/verificacion-identidad` | `nuevoEstado: ArcoIdentityVerificationStatus` | `ApiResponseDTO<ArcoRequestResponseDTO>` | Actualizar estado de verificación de identidad |
| PATCH | `/api/arco-request/{id}/resolucion` | `UpdateArcoStatusDTO` | `ApiResponseDTO<ArcoRequestResponseDTO>` | Registrar resolución de la solicitud |
| POST | `/api/arco-request/cancellation` | `ArcoCancellationRequestDTO` | `ArcoRequestResponseDTO` | Crear solicitud de cancelación (tipo BLOCK/DELETE/ANONYMIZE) |
| POST | `/api/arco-request/cancellation/{solicitudId}/execute` | `solicitudId: UUID` | `ArcoRequestResponseDTO` | Ejecutar derecho de cancelación |

### ArcoRequestActionsController — base `/api/arco-request/{arcoRequestId}/acciones`

| Verbo | Path | Entrada | Respuesta | Descripción |
|---|---|---|---|---|
| GET | `/.../acciones` | `arcoRequestId: UUID` | `List<ArcoRequestActionResponseDTO>` | Listar acciones registradas |
| POST | `/.../acciones` | `ArcoRequestActionCreateDTO` | `ArcoRequestActionResponseDTO` | Registrar acción ejecutada sobre la solicitud |

### ArcoRequestEvidencesController — base `/api/arco-request/{arcoRequestId}/evidencias`

| Verbo | Path | Entrada | Respuesta | Descripción |
|---|---|---|---|---|
| GET | `/.../evidencias` | `arcoRequestId: UUID` | `List<ArcoRequestEvidenceResponseDTO>` | Listar evidencias |
| POST | `/.../evidencias` | `ArcoRequestEvidenceCreateDTO` | `ArcoRequestEvidenceResponseDTO` | Agregar evidencia |
| DELETE | `/.../evidencias/{evidenceId}` | `evidenceId: UUID` | `Void` | Eliminar evidencia |

### ArcoRequestStatusHistoryController — base `/api/arco-request/{arcoRequestId}/historial`

| Verbo | Path | Entrada | Respuesta | Descripción |
|---|---|---|---|---|
| GET | `/.../historial` | `arcoRequestId: UUID` | `List<ArcoRequestStatusHistoryResponseDTO>` | Historial de cambios de estado |

### HealthController

| Verbo | Path | Respuesta | Descripción |
|---|---|---|---|
| GET | `/api/health` | `String` | Health check del servicio |

> Nota: existe el paquete `com.example.demo.arco.opposition` para el flujo de Oposición; sus endpoints REST específicos están pendientes/en desarrollo (ver `OPPOSITION_PROMPT.md`).

---

## 4. Compliance-service (`:8083`)

### ConsentController — base `/api/compliance/consents`

| Verbo | Path | Entrada | Respuesta | Descripción |
|---|---|---|---|---|
| GET | `/api/compliance/consents` | `dataSubjectId?`, `status?`, `Pageable` | `Page<ConsentResponseDTO>` | Listar consentimientos paginados (respuesta sin wrapper) |
| GET | `/api/compliance/consents/{id}` | `id: UUID` | `ConsentResponseDTO` | Obtener consentimiento (sin wrapper) |
| GET | `/api/compliance/consents/data-subject/{dataSubjectId}` | `dataSubjectId: UUID` | `List<ConsentResponseDTO>` | Consentimientos de un titular (sin wrapper) |
| POST | `/api/compliance/consents` | `ConsentCreateRequestDTO` | `ConsentResponseDTO` | Crear consentimiento |
| PUT | `/api/compliance/consents/{id}/data-categories` | `ConsentCategoriesUpdateRequestDTO` | `ConsentResponseDTO` | Actualizar categorías de datos del consentimiento |
| POST | `/api/compliance/consents/{id}/revoke` | `ConsentActionRequestDTO` | `ConsentResponseDTO` | Revocar consentimiento |
| POST | `/api/compliance/consents/{id}/grant` | `ConsentActionRequestDTO` | `ConsentResponseDTO` | Otorgar consentimiento |
| GET | `/api/compliance/consents/pending` | `organizationId`, `personId` | `List<ConsentDefinitionResponseDTO>` | Definiciones pendientes (requeridas y no otorgadas) |
| GET | `/api/compliance/consents/{id}/events` | `id: UUID` | `List<ConsentEventResponseDTO>` | Eventos (auditoría) del consentimiento |

### ConsentDefinitionController — base `/api/compliance/consent-definitions`

| Verbo | Path | Entrada | Respuesta | Descripción |
|---|---|---|---|---|
| GET | `/api/compliance/consent-definitions` | `organizationId: UUID` | `List<ConsentDefinitionResponseDTO>` | Listar definiciones (sin wrapper) |
| POST | `/api/compliance/consent-definitions` | `ConsentDefinitionCreateRequestDTO` | `ConsentDefinitionResponseDTO` | Crear definición de consentimiento |
| PATCH | `/api/compliance/consent-definitions/{id}/active` | `value: boolean` | `ConsentDefinitionResponseDTO` | Activar/desactivar definición |

### DataCategoryController — base `/api/compliance/data-categories`

| Verbo | Path | Entrada | Respuesta | Descripción |
|---|---|---|---|---|
| GET | `/api/compliance/data-categories` | — | `List<DataCategoryResponseDTO>` | Listar categorías de datos activas (catálogo Art. 2g) |

### TreatmentActivityController — base `/api/compliance/rat`

| Verbo | Path | Entrada | Respuesta | Descripción |
|---|---|---|---|---|
| GET | `/api/compliance/rat` | `organizationId`, `status?` | `List<TreatmentActivityResponseDTO>` | Listar actividades de tratamiento (RAT) |
| GET | `/api/compliance/rat/{id}` | `id: UUID` | `TreatmentActivityResponseDTO` | Obtener actividad por ID |
| POST | `/api/compliance/rat` | `TreatmentActivityCreateRequestDTO` | `TreatmentActivityResponseDTO` | Crear actividad de tratamiento |
| PUT | `/api/compliance/rat/{id}` | `TreatmentActivityUpdateRequestDTO` | `TreatmentActivityResponseDTO` | Actualizar actividad de tratamiento |

### HealthController

| Verbo | Path | Respuesta | Descripción |
|---|---|---|---|
| GET | `/api/health` | `String` | Health check del servicio |

> ⚠️ Recordar: estos endpoints de Compliance **no** usan el wrapper `ApiResponseDTO<T>` — devuelven el objeto/array/página directamente (ver tabla "Frontend API Response Inconsistency" en `CLAUDE.md`).

---

## 5. bff-api (`:8085`) — punto de entrada del frontend (`/api`)

### AuthBffController — base `/api/auth`

| Verbo | Path | Reenvía a (downstream) | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | `POST auth-service /api/auth/login` | Login |
| POST | `/api/auth/register` | `POST auth-service /api/auth/register` | Registro |
| GET | `/api/auth/me` | `GET auth-service /api/auth/me` | Perfil autenticado |
| GET | `/api/auth/users` | `GET auth-service /api/auth/users` | Listar usuarios |
| GET | `/api/auth/users/{userId}` | `GET auth-service /api/auth/users/{userId}` | Obtener usuario |
| POST | `/api/auth/users/{userId}/roles` | `POST auth-service /api/auth/users/{userId}/roles` | Asignar rol |
| GET | `/api/auth/roles` | `GET auth-service /api/auth/roles` | Listar roles |
| POST | `/api/auth/roles` | `POST auth-service /api/auth/roles` | Crear rol |
| GET | `/api/auth/permissions` | `GET auth-service /api/auth/permissions` | Listar permisos |
| POST | `/api/auth/roles/{roleId}/permissions` | `POST auth-service /api/auth/roles/{roleId}/permissions` | Asignar permiso a rol |
| DELETE | `/api/auth/roles/{roleId}/permissions/{permissionId}` | `DELETE auth-service /api/auth/roles/{roleId}/permissions/{permissionId}` | Quitar permiso de rol |
| POST | `/api/auth/me/activate` | `POST auth-service /api/auth/me/activate` | Activar cuenta |
| GET | `/api/auth/audit` | `GET auth-service /api/auth/audit` | Logs de auditoría |
| POST | `/api/auth/password/forgot` | `POST auth-service /api/auth/password/forgot` | Solicitar reset de contraseña |
| POST | `/api/auth/password/reset` | `POST auth-service /api/auth/password/reset` | Restablecer contraseña |

### OrganizationBffController — base `/api/organizations`

| Verbo | Path | Reenvía a (downstream) | Descripción |
|---|---|---|---|
| GET | `/api/organizations` | `GET organization-service /api/organizations` | Listar organizaciones |
| GET | `/api/organizations/{id}` | `GET organization-service /api/organizations/{id}` | Obtener organización |
| POST | `/api/organizations` | `POST organization-service /api/organizations` | Crear organización |
| PUT | `/api/organizations/{id}` | `PUT organization-service /api/organizations/{id}` | Actualizar organización |
| PATCH | `/api/organizations/{id}/status` | `PATCH organization-service /api/organizations/{id}/status` | Cambiar estado de organización |
| GET | `/api/organizations/{orgId}/departments` | `GET .../departments` | Listar departamentos |
| GET | `/api/organizations/{orgId}/departments/{deptId}` | `GET .../departments/{deptId}` | Obtener departamento |
| POST | `/api/organizations/{orgId}/departments` | `POST .../departments` | Crear departamento |
| PUT | `/api/organizations/{orgId}/departments/{deptId}` | `PUT .../departments/{deptId}` | Actualizar departamento |
| PATCH | `/api/organizations/{orgId}/departments/{deptId}/status` | `PATCH .../departments/{deptId}/status` | Cambiar estado de departamento |
| GET | `/api/organizations/{orgId}/persons` | `GET .../persons` | Listar personas |
| GET | `/api/organizations/{orgId}/persons/{personId}` | `GET .../persons/{personId}` | Obtener persona |
| POST | `/api/organizations/{orgId}/persons/invite` | `POST .../persons` **+** `POST auth-service /api/auth/invite` | **Orquestado:** crea `Person` y crea `User PENDING` |
| PUT | `/api/organizations/{orgId}/persons/{personId}` | `PUT .../persons/{personId}` | Actualizar persona |
| PATCH | `/api/organizations/{orgId}/persons/{personId}/status` | `PATCH .../persons/{personId}/status` | Cambiar estado de persona |

### ArcoBffController — base `/api/arco`

| Verbo | Path | Reenvía a (downstream) | Descripción |
|---|---|---|---|
| GET | `/api/arco` | `GET arco-service /api/arco-request` | Listar solicitudes ARCO |
| GET | `/api/arco/{id}` | `GET arco-service /api/arco-request/{id}` | Obtener solicitud |
| GET | `/api/arco/by-subject/{dataSubjectId}` | `GET arco-service /api/arco-request/by-subject/{dataSubjectId}` | Solicitudes por titular |
| POST | `/api/arco` | `POST arco-service /api/arco-request` | Crear solicitud |
| PATCH | `/api/arco/{id}/status` | `PATCH arco-service /api/arco-request/{id}/estado` | Cambiar estado |
| PATCH | `/api/arco/{id}/prorroga` | `PATCH arco-service /api/arco-request/{id}/prorroga` | Otorgar prórroga |

### ComplianceBffController — base `/api/compliance`

| Verbo | Path | Reenvía a (downstream) | Descripción |
|---|---|---|---|
| GET | `/api/compliance/consents` | `GET compliance-service /api/compliance/consents` | Listar consentimientos |
| GET | `/api/compliance/consents/data-subject/{dataSubjectId}` | `GET .../consents/data-subject/{dataSubjectId}` | Consentimientos por titular |
| POST | `/api/compliance/consents` | `POST .../consents` | Crear consentimiento |
| POST | `/api/compliance/consents/{consentId}/revoke` | `POST .../consents/{consentId}/revoke` | Revocar consentimiento |
| POST | `/api/compliance/consents/{consentId}/grant` | `POST .../consents/{consentId}/grant` | Otorgar consentimiento |
| GET | `/api/compliance/consents/pending` | `GET .../consents/pending` | Consentimientos pendientes |
| GET | `/api/compliance/consent-definitions` | `GET .../consent-definitions` | Listar definiciones |
| POST | `/api/compliance/consent-definitions` | `POST .../consent-definitions` | Crear definición |
| PATCH | `/api/compliance/consent-definitions/{id}/active` | `PATCH .../consent-definitions/{id}/active` | Activar/desactivar definición |
| GET | `/api/compliance/data-categories` | `GET .../data-categories` | Catálogo de categorías de datos |
| GET | `/api/compliance/rat` | `GET .../rat` | Registro de Actividades de Tratamiento |

### ArcoProxyController — base `/api/arco` (flujo de cancelación)

| Verbo | Path | Reenvía a (downstream) | Descripción |
|---|---|---|---|
| POST | `/api/arco/cancellation` | `POST arco-service /api/arco-request/cancellation` | Crear solicitud de cancelación |
| POST | `/api/arco/cancellation/{solicitudId}/execute` | `POST arco-service /api/arco-request/cancellation/{solicitudId}/execute` | Ejecutar cancelación (orquesta bloqueo/eliminación/anonimización en Organization-service) |

---

## 6. Notas Generales

1. **Health checks:** todos los microservicios (`8080`-`8083`) exponen `GET /api/health`.
2. **Paginación:** Compliance-service usa `Pageable` de Spring Data; el BFF simplifica con `page`/`size`.
3. **Autenticación:** el BFF reenvía el header `Authorization`; la validación del JWT y los permisos (`@PreAuthorize`) ocurren en cada microservicio (mayormente Auth-service).
4. **Respuestas del BFF:** generalmente `Map<String, Object>` (proxy directo del JSON del microservicio) o DTOs específicos en los endpoints orquestados/proxy de ARCO.
5. **Gotcha de errores BFF:** errores de negocio (4xx) del microservicio llegan como HTTP 200 con `{success:false, message:"..."}` — ver sección "BFF Error Handling" en `CLAUDE.md`.
