# Requisitos del Sistema — PrivData

**Contexto:** PrivData es una plataforma académica single-tenant para apoyar el cumplimiento de la **Ley 21.719** (protección de datos personales, Chile) en una organización mediana. Basado en `docs/PRD.md` (v1.0, 2026-05-22).

> **Última revisión:** 2026-06-14 — Se incorporaron requisitos derivados del análisis de Arts. 11 y 8° ter de la Ley 21.719, correcciones al flujo de estados ARCO, cierre automático por scheduler y patrón Factory Method por derecho.

---

## 1. Actores y Roles

| Rol | Descripción | Permisos clave |
|---|---|---|
| `SUPER_ADMIN` | Administrador de la plataforma. Acceso total. | Todos |
| `ORG_ADMIN` | Responsable de datos de la organización. | `USER_VIEW/CREATE`, `ROLE_VIEW/ASSIGN`, `ARCO_*`, `RAT_*`, `AUDIT_VIEW` |
| `ANALYST` | Analista de cumplimiento. Gestiona RAT y ARCO. | `ARCO_VIEW/CREATE/RESOLVE`, `RAT_VIEW/CREATE/UPDATE/EXPORT` |
| `AUDITOR` | Auditor interno o externo, solo lectura. | `AUDIT_VIEW` |
| `END_USER` | Titular de datos, accede al portal propio. | `ARCO_VIEW`, `ARCO_CREATE` |

---

## 2. Requisitos Funcionales

### 2.1 Módulo de Autenticación y Sesión (`/login`)

| ID | Requisito |
|---|---|
| RF-AUTH-01 | El sistema debe permitir login con email y contraseña, retornando un JWT. |
| RF-AUTH-02 | El sistema debe exponer `/auth/me` para obtener el perfil del usuario autenticado, incluyendo `organizationId`, rol y permisos. |
| RF-AUTH-03 | El frontend debe almacenar el JWT en `sessionStorage` y adjuntarlo automáticamente a cada request vía interceptor de axios. |
| RF-AUTH-04 | Un usuario con rol `END_USER` debe ser redirigido automáticamente al portal del titular tras el login. |
| RF-AUTH-05 | El sistema debe permitir recuperación de contraseña mediante código enviado por email (`/auth/password/forgot`, `/auth/password/reset`). |
| RF-AUTH-06 | El sistema debe soportar activación de cuenta para usuarios `PENDING` (definición de contraseña en primer ingreso). |
| RF-AUTH-07 | El sistema debe bloquear temporalmente una cuenta tras superar un número de intentos fallidos de login (`failedLoginAttempts`, `lockedUntil`). |

### 2.2 Módulo de Gestión de Usuarios, Roles y Permisos (`/admin/usuarios`, `/admin/roles`)

| ID | Requisito |
|---|---|
| RF-USR-01 | El sistema debe permitir listar usuarios de la organización, con su rol y estado (`PENDING`, `ACTIVE`, `BLOCKED`, `INACTIVE`). |
| RF-USR-02 | El sistema debe permitir registrar/invitar un nuevo usuario asociado a una `Person` y a un departamento. |
| RF-USR-03 | El sistema debe permitir asignar o cambiar el rol de un usuario. |
| RF-USR-04 | El sistema debe permitir listar los roles existentes y sus permisos asignados. |
| RF-USR-05 | El sistema debe permitir crear roles personalizados. |
| RF-USR-06 | El sistema debe permitir asignar y remover permisos de un rol. |
| RF-USR-07 | Todas las operaciones de creación/asignación deben estar protegidas por `@PreAuthorize` (`USER_CREATE`, `USER_VIEW`, `ROLE_ASSIGN`, `ROLE_VIEW`). |

### 2.3 Módulo Mi Organización (`/admin/organizacion`)

| ID | Requisito |
|---|---|
| RF-ORG-01 | El sistema debe permitir ver y editar los datos de la organización (nombre, razón social, RUT, email, tipo de negocio, dirección). |
| RF-ORG-02 | El sistema debe permitir activar/desactivar la organización (`PATCH /organizations/{id}/status`). |
| RF-ORG-03 | El sistema debe permitir crear, listar, editar y activar/desactivar departamentos de la organización. |
| RF-ORG-04 | El sistema debe permitir gestionar la configuración de la organización (`OrganizationSettings`: idioma por defecto, email de privacidad, permiso de exportación de datos). |
| RF-ORG-05 | La organización debe inicializarse (seed) con un UUID fijo coherente entre `Auth-service` y `Organization-service`. |

### 2.4 Módulo de Titulares / Personas (`/titulares`)

| ID | Requisito |
|---|---|
| RF-PER-01 | El sistema debe permitir registrar personas (titulares o colaboradores) asociadas a una organización y, opcionalmente, a un departamento. |
| RF-PER-02 | El sistema debe permitir listar personas con filtros por departamento y estado activo. |
| RF-PER-03 | El sistema debe permitir editar datos de una persona y cambiar su estado (`isActive`). |
| RF-PER-04 | El sistema debe mantener un campo `dataStatus` (`ACTIVE`, `BLOCKED`, `DELETION_REQUESTED`, `ANONYMIZED`) que refleje el estado de los derechos ARCO ejercidos sobre la persona. |

### 2.5 Módulo de Solicitudes ARCO (`/arco`, `/portal`)

#### 2.5.1 Base común — Art. 11 Ley 21.719 (procedimental)

Todos los derechos ARCO comparten el mismo procedimiento antes y después de resolverse. Los requisitos de esta sección aplican a **todos los tipos** de solicitud.

| ID | Requisito |
|---|---|
| RF-ARCO-01 | El sistema debe permitir a un titular (`END_USER`) crear una solicitud ARCO de tipo Acceso, Rectificación, Supresión, Oposición o Portabilidad. |
| RF-ARCO-02 | Toda solicitud ARCO debe registrar `submittedAt` y calcular `dueDate = submittedAt + 30 días corridos` (Art. 11). Excepción: Supresión/Bloqueo usa `dueDate = submittedAt + 2 días hábiles` (Art. 8° ter). |
| RF-ARCO-03 | El sistema debe permitir prorrogar el plazo una vez por 30 días corridos adicionales (`extensionGranted`, `extendedDueDate`). No aplica a Supresión. |
| RF-ARCO-04 | El sistema debe permitir listar solicitudes ARCO con filtros por organización, titular y estado. |
| RF-ARCO-05 | El sistema debe gestionar el flujo de estados `RECIBIDA → EN_REVISION → EN_GESTION → RESPONDIDA / RECHAZADA → CERRADA`, con las siguientes reglas: (a) `EN_REVISION` es visible para el **titular** en su portal de seguimiento (indica que la solicitud fue abierta y está en verificación de identidad, Art. 11a); el panel de admin omite este estado y avanza automáticamente a `EN_GESTION` al abrir el modal de gestión; (b) al pasar a `RESPONDIDA` o `RECHAZADA`, el sistema calcula `agencyClaimDeadline = resolvedAt + 30 días hábiles`; (c) el estado `CERRADA` solo se alcanza automáticamente por scheduler cuando vence `agencyClaimDeadline`. Cada transición se registra en `ArcoRequestStatusHistory`. |
| RF-ARCO-06 | El sistema debe gestionar la verificación de identidad del solicitante (`PENDIENTE`, `VERIFICADA`, `RECHAZADA`) como paso obligatorio en `EN_REVISION` antes de pasar a `EN_GESTION`. |
| RF-ARCO-07 | El sistema debe permitir registrar acciones ejecutadas sobre una solicitud (`ArcoRequestActions`) y adjuntar evidencias (`ArcoRequestEvidences`). |
| RF-ARCO-08 | Al resolver una solicitud, el sistema debe registrar `resolutionSummary`, `resolvedAt` y, en caso de rechazo, `denialLegalBasis` con la norma legal que fundamenta la denegación (Art. 5° Ley 21.719). El campo `denialLegalBasis` es obligatorio para pasar a `RECHAZADA`. |
| RF-ARCO-09 | El sistema debe registrar el canal de recepción de la solicitud (`WEB_PORTAL`, `EMAIL`, `PHONE`, `IN_PERSON`, `LETTER`, `INTERNAL`). |
| RF-ARCO-10 | Al resolver una solicitud de Rectificación, Supresión u Oposición, el sistema debe registrar si los datos fueron comunicados a terceros y si se notificó el cambio a dichos terceros (Art. 11 — Comunicación a terceros). No aplica a Acceso. |
| RF-ARCO-11 | El sistema debe notificar al titular por email: (a) acuse de recibo al crear la solicitud; (b) cada cambio de estado; (c) resolución final con resumen; (d) cierre automático con instrucciones para reclamar ante la Agencia. |
| RF-ARCO-12 | El titular debe poder ver el detalle y seguimiento de sus propias solicitudes desde el portal (`/portal/seguimiento`), incluyendo: estado actual, días restantes, resolución, fecha de cierre automático y opción de registrar disconformidad. |
| RF-ARCO-13 | Toda solicitud ARCO debe validar el contenido mínimo del Art. 11 antes de persistir: (a) identificación y autenticación del titular; (b) domicilio o correo para la respuesta; (c) identificación del dato o tratamiento involucrado; (d) contenido específico según el derecho ejercido. |

#### 2.5.2 Cierre automático (Art. 11, paso 7)

| ID | Requisito |
|---|---|
| RF-ARCO-CIE-01 | Al pasar al estado `RESPONDIDA` o `RECHAZADA`, el sistema debe calcular y persistir `agencyClaimDeadline = resolvedAt + 30 días hábiles`, usando el `DeadlineCalculatorService` que considera feriados chilenos. |
| RF-ARCO-CIE-02 | Un scheduler (`ArcoAutoCloseScheduler`) debe ejecutarse diariamente y pasar a `CERRADA` todas las solicitudes en estado `RESPONDIDA` o `RECHAZADA` cuyo `agencyClaimDeadline` haya vencido, registrando `closedAt` y una entrada en `ArcoRequestStatusHistory`. |
| RF-ARCO-CIE-03 | El titular puede registrar disconformidad con la resolución (`titularDisconforme = true`) desde el portal, antes de que venza `agencyClaimDeadline`. Este registro no cambia el estado de la solicitud ni impide el cierre automático; es solo un registro interno y un aviso de que el titular fue informado del reclamo ante la Agencia. |
| RF-ARCO-CIE-04 | El portal del titular debe mostrar: la fecha de cierre automático prevista, el contador de días hábiles restantes para reclamar, el botón "No estoy conforme" (con textarea de motivo y checkbox de confirmación), y — si ya registró disconformidad — el enlace a `cpd.cl` para reclamar ante la Agencia. |

#### 2.5.3 Por derecho — norma sustantiva

Los siguientes requisitos definen el contenido específico (campo `d` del Art. 11) de cada tipo de solicitud. Se implementan mediante el **patrón Factory Method**: cada `ArcoRequestFactory` concreto hereda la validación base del Art. 11 y agrega la validación específica de su derecho.

##### Derecho de Acceso (Art. 6° Ley 21.719)

| ID | Requisito |
|---|---|
| RF-ARCO-ACC-01 | La solicitud debe identificar el dato o conjunto de datos sobre los que se solicita acceso. |
| RF-ARCO-ACC-02 | La respuesta debe entregarse en formato legible, indicando origen, finalidad del tratamiento y destinatarios. |
| RF-ARCO-ACC-03 | El sistema debe registrar el formato en que se entregó la respuesta (`resolutionSummary`). |

##### Derecho de Rectificación (Art. 7° Ley 21.719)

| ID | Requisito |
|---|---|
| RF-ARCO-REC-01 | El DTO de creación debe incluir: campo a rectificar (`fieldToRectify`), valor actual erróneo (`currentValue`) y valor correcto según documentación (`correctedValue`). |
| RF-ARCO-REC-02 | El analista debe verificar que la modificación solicitada esté sustentada en antecedentes (ej. cédula, certificado). |
| RF-ARCO-REC-03 | Al resolver, el sistema debe registrar si los datos rectificados fueron comunicados a terceros que los recibieron previamente. |

##### Derecho de Supresión / Bloqueo Temporal (Arts. 7° y 8° ter Ley 21.719)

| ID | Requisito |
|---|---|
| RF-ARCO-SUP-01 | El plazo de respuesta para Supresión es de **2 días hábiles** desde la recepción de la solicitud (Art. 8° ter), calculado con `DeadlineCalculatorService`. |
| RF-ARCO-SUP-02 | El bloqueo debe aplicarse **desde que se recibe** la solicitud, no desde que se resuelve (Art. 8° ter — prohibición inmediata). |
| RF-ARCO-SUP-03 | La decisión es binaria: aceptar (ejecutar `BLOCK`, `DELETE` o `ANONYMIZE` sobre `Person` en Organization-service) o rechazar. No existe estado intermedio de revisión extendida. |
| RF-ARCO-SUP-04 | Si se rechaza, el sistema debe registrar el fundamento y comunicarlo electrónicamente a la Agencia (campo `denialLegalBasis` obligatorio). |
| RF-ARCO-SUP-05 | Al resolver con aceptación, el sistema debe registrar si se notificó el cambio a terceros que recibieron los datos. |

##### Derecho de Oposición (Art. 8° Ley 21.719)

| ID | Requisito |
|---|---|
| RF-ARCO-OPO-01 | La solicitud debe indicar la causal de oposición (`OppositionCausal`): interés legítimo o marketing directo. |
| RF-ARCO-OPO-02 | Si la causal es `MARKETING_DIRECTO`, la oposición es irrechazable — el sistema debe impedirlo (`requiresMandatoryAcceptance = true`). |
| RF-ARCO-OPO-03 | Si la causal es `INTERES_LEGITIMO`, el titular debe aportar justificación (`justification`), y el analista evalúa si es válida. |
| RF-ARCO-OPO-04 | El sistema debe soportar bloqueo temporal de 2 días hábiles mientras se tramita la oposición (`TemporaryBlock`). |
| RF-ARCO-OPO-05 | Al resolver, el sistema debe registrar si se notificó el cambio a terceros que recibieron los datos. |

##### Derecho de Portabilidad (Art. 9° Ley 21.719)

| ID | Requisito |
|---|---|
| RF-ARCO-PORT-01 | El DTO de creación debe incluir: formato de exportación solicitado (`exportFormat`: JSON, CSV, XML) y, si aplica, identificación de la entidad receptora (`recipientEntity`). |
| RF-ARCO-PORT-02 | El sistema debe registrar en la resolución el formato entregado y el medio de entrega. |
| RF-ARCO-PORT-03 | La portabilidad no aplica sobre datos inferidos o derivados por el responsable — el analista debe validarlo antes de ejecutar. |

### 2.6 Módulo RAT — Registro de Actividades de Tratamiento (`/rat`)

| ID | Requisito |
|---|---|
| RF-RAT-01 | El sistema debe permitir crear y editar actividades de tratamiento (`TreatmentActivity`) con nombre, descripción, propósito y base legal. |
| RF-RAT-02 | Cada actividad debe poder asociarse a una o más categorías de datos del catálogo (`DataCategory`, 20 ítems según Art. 2g). |
| RF-RAT-03 | El sistema debe indicar automáticamente si una actividad contiene datos sensibles, en función de las categorías asociadas marcadas como `sensitive: true`. |
| RF-RAT-04 | Cada actividad debe registrar período de retención (`retentionPeriodDays`), sistemas que la soportan (`dataSystems`), destinatarios externos (`thirdPartyRecipients`), si implica transferencia internacional (`internationalTransfer`) y medidas de seguridad (`securityMeasures`). |
| RF-RAT-05 | El sistema debe permitir listar actividades por organización, con filtro por estado (`ACTIVE`, `INACTIVE`, `UNDER_REVIEW`). |
| RF-RAT-06 | El sistema debe permitir exportar el RAT (PDF/Excel) — *pendiente de implementación según roadmap*. |

### 2.7 Módulo de Consentimientos (`/consentimientos`)

| ID | Requisito |
|---|---|
| RF-CON-01 | El sistema debe permitir definir plantillas de consentimiento (`ConsentDefinition`) por organización, con título, descripción, base legal y si son obligatorias (`required`). |
| RF-CON-02 | El sistema debe permitir activar/desactivar definiciones de consentimiento. |
| RF-CON-03 | El sistema debe permitir registrar el consentimiento otorgado por un titular (`Consent`), asociado a una definición, propósito, versión de política y categorías de datos. |
| RF-CON-04 | El sistema debe permitir otorgar (`grant`) y revocar (`revoke`) un consentimiento, manteniendo `grantedAt`/`revokedAt`. |
| RF-CON-05 | Cada cambio de consentimiento debe generar un evento de auditoría (`ConsentEvent`: `GRANT`, `REVOKE`, `UPDATE_CATEGORIES`) con hash de evidencia (`evidenceHash`), canal, IP y user-agent. |
| RF-CON-06 | El sistema debe permitir consultar consentimientos por titular y los consentimientos pendientes (definiciones requeridas no otorgadas) para una persona. |
| RF-CON-07 | El sistema debe registrar el método de recolección del consentimiento (`WEB_PORTAL`, `ADMIN_PANEL`, `EMAIL`, `PHONE`, `IN_PERSON`). |

### 2.8 Módulo de Auditoría (`/auditoria`)

| ID | Requisito |
|---|---|
| RF-AUD-01 | El sistema debe registrar eventos de auditoría (`AuditLog`) con acción, tipo de entidad, detalle, email de quien ejecuta y fecha. |
| RF-AUD-02 | El sistema debe permitir consultar el log de auditoría paginado, filtrado por organización (`GET /auth/audit`). |
| RF-AUD-03 | El acceso al módulo de auditoría debe requerir el permiso `AUDIT_VIEW`. |

### 2.9 Portal del Titular (`/portal`)

| ID | Requisito |
|---|---|
| RF-POR-01 | El titular debe poder ver un resumen de sus consentimientos y solicitudes ARCO propias. |
| RF-POR-02 | El titular debe poder crear una nueva solicitud ARCO desde el portal. |
| RF-POR-03 | El titular debe poder ver/revocar sus propios consentimientos. |
| RF-POR-04 | Un usuario `PENDING` debe poder completar su perfil (nombre, RUT, etc.) en su primer ingreso, pasando a estado `ACTIVE`. |
| RF-POR-05 | El titular debe poder registrar disconformidad con la resolución de una solicitud (`POST /arco-request/{id}/disconformidad`) antes de que venza `agencyClaimDeadline`, con textarea de motivo opcional y confirmación explícita de que el reclamo se gestiona ante la Agencia externa. |

### 2.10 Dashboard (`/dashboard`)

| ID | Requisito |
|---|---|
| RF-DASH-01 | El sistema debe mostrar KPIs: solicitudes ARCO pendientes, consentimientos activos, actividades RAT vigentes. |

---

## 3. Requisitos No Funcionales

| ID | Atributo | Requisito |
|---|---|---|
| RNF-01 | Seguridad | Autenticación basada en JWT firmado; autorización a nivel de método con `@PreAuthorize("hasAuthority('PERMISO')")`; contraseñas almacenadas con BCrypt (`PasswordEncoder`). |
| RNF-02 | Trazabilidad | Todas las entidades relevantes deben mantener `createdAt`/`updatedAt` (Hibernate `@CreationTimestamp`/`@UpdateTimestamp`). Las solicitudes ARCO registran adicionalmente `resolvedAt`, `agencyClaimDeadline` y `closedAt`. |
| RNF-03 | Mantenibilidad | Patrón uniforme `Controller → Service → Repository` con DTOs de entrada/salida y envoltorio `ApiResponseDTO<T>`. La creación de solicitudes ARCO sigue el **patrón Factory Method**: `ArcoRequestFactory` (abstracto) con implementaciones concretas por derecho (`AccesoFactory`, `RectificacionFactory`, `SupresionFactory`, `OposicionFactory`, `PortabilidadFactory`), cada una heredando la validación base del Art. 11 y agregando la validación específica de su derecho. |
| RNF-04 | Portabilidad | Despliegue completo vía Docker Compose; configuración sensible mediante variables de entorno. |
| RNF-05 | Cumplimiento legal | Plazos ARCO según Art. 11 y Art. 8° ter Ley 21.719: 30 días corridos (prorrogable una vez) para Acceso/Rectificación/Oposición/Portabilidad; 2 días hábiles para Supresión/Bloqueo. Cierre automático 30 días hábiles después de notificada la resolución. Categorías de datos sensibles según Art. 2g. Bases legales según Arts. 12-13. |
| RNF-06 | Disponibilidad de servicios | Cada microservicio expone `GET /api/health` para verificación de estado. |
| RNF-07 | Consistencia de datos | Cada microservicio posee su propia base de datos PostgreSQL; las relaciones entre servicios se mantienen mediante UUIDs (FKs lógicas), sin transacciones distribuidas. |
| RNF-08 | UX | Interfaz responsive con shadcn/ui + Tailwind CSS; navegación condicionada por permisos del usuario (`RequirePermission`). |
| RNF-09 | Automatización de plazos | El sistema ejecuta un scheduler diario (`ArcoAutoCloseScheduler`, cron `0 0 2 * * *`) que cierra automáticamente las solicitudes ARCO cuyo plazo de reclamo ante la Agencia haya vencido, sin intervención manual del administrador. |

---

## 4. Restricciones y Supuestos

- **Single-tenant:** una sola organización por despliegue; `organizationId` se siembra al iniciar cada servicio (`DataInitializer`) y debe coincidir entre `Auth-service` y `Organization-service`.
- El `organizationId` **nunca** debe hardcodearse en el frontend; se obtiene de `/auth/me`.
- `spring.jpa.hibernate.ddl-auto=update` se usa en desarrollo; no elimina ni recrea *check constraints* — cambios de enums usados en constraints requieren resetear el volumen de la BD afectada.
- El BFF no implementa lógica de negocio ni autorización propia: solo reenvía el header `Authorization` y orquesta llamadas a microservicios.
- Las respuestas del BFF para errores de negocio (4xx de microservicios) llegan como HTTP 200 con `{success: false, message}` — el frontend debe validar `response.data.success`.
- El reclamo ante la Agencia de Protección de Datos es un proceso **externo** al sistema (www.cpd.cl). PrivData solo registra la intención del titular (`titularDisconforme`) y le provee el enlace; no gestiona la tramitación ante la Agencia.

### Fuera de alcance (excluido del proyecto académico)

- Firma electrónica avanzada.
- Notificaciones por email/SMS reales en producción (se usa Mailhog para desarrollo).
- Multi-tenancy.
- Integración con Google OAuth.
- API Gateway / Service Discovery (Eureka).
- Gestión del reclamo ante la Agencia dentro del sistema.

---

## 5. Estado de Implementación (resumen)

| Módulo | Backend | Frontend |
|---|---|---|
| Auth (login, JWT, roles, permisos) | ✅ Completo | ✅ Operativo |
| Mi Organización + Departamentos | ✅ Completo | ✅ Operativo |
| Gestión de Usuarios | ✅ Endpoints | 🔄 Scaffolded |
| Gestión de Roles/Permisos | ✅ Endpoints | 🔄 Scaffolded |
| RAT (actividades de tratamiento) | ✅ Completo | ❌ Pendiente |
| Consentimientos | ✅ Modelo/endpoints | ❌ Pendiente |
| Solicitudes ARCO — base común | ✅ Completo | 🔄 En integración |
| ARCO — Oposición | ✅ Modelo/service | 🔄 Panel en frontend |
| ARCO — Supresión/Bloqueo | ✅ Lógica 2 días hábiles | 🔄 Panel en frontend |
| ARCO — Rectificación | 🔄 Falta DTO específico (RF-ARCO-REC-01) | 🔄 Panel en frontend |
| ARCO — Portabilidad | 🔄 Falta DTO específico (RF-ARCO-PORT-01) | 🔄 Panel en frontend |
| ARCO — Factory Method | 🔄 Pendiente implementar | ❌ N/A |
| ARCO — Cierre automático (scheduler) | 🔄 Implementado en sesión 2026-06-14 | ✅ TitularSeguimiento actualizado |
| Portal del Titular | N/A | 🔄 Layout y componentes creados |
| Portal — Disconformidad titular | 🔄 Endpoint pendiente de agregar | ✅ Componente implementado |
| Dashboard | N/A | ❌ Solo placeholder |
| Auditoría | ✅ Endpoints | 🔄 Página presente |
| Flujo invitación / primer login | 🔄 En progreso | 🔄 En progreso |

> **Pendientes críticos post sesión 2026-06-14:**
> 1. Agregar `agencyClaimDeadline`, `titularDisconforme`, `closedAt` a `ArcoRequest` y `ArcoRequestResponseDTO`.
> 2. Agregar endpoint `POST /arco-request/{id}/disconformidad` en `ArcoRequestController`.
> 3. Corregir nombre de archivo `RectificationrequestRepository.java` → `RectificationRequestRepository.java`.
> 4. Implementar DTOs específicos para Rectificación (`fieldToRectify`, `currentValue`, `correctedValue`) y Portabilidad (`exportFormat`, `recipientEntity`).
> 5. Implementar `ArcoRequestFactory` y sus 5 factories concretas.