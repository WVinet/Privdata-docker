# PRD — PrivData: Plataforma de Gestión de Datos Personales
**Product Requirements Document · Versión 1.0 · 2026-05-22**

---

## 1. Contexto y Problema

Chile promulgó la **Ley 21.719** (vigente 2026), que impone obligaciones concretas a cualquier organización que trate datos personales: registrar actividades de tratamiento, gestionar consentimientos, responder solicitudes ARCO en 30 días corridos y designar responsabilidades claras.

Las pymes y organismos educativos **no tienen herramientas accesibles** para cumplir esta ley. Los sistemas existentes son complejos, costosos o están orientados al GDPR europeo sin adaptación al marco chileno.

**PrivData** es una plataforma académica que demuestra cómo una organización de tamaño mediano puede implementar cumplimiento práctico de la Ley 21.719 con tecnología open-source.

---

## 2. Objetivo del Producto

Proveer una plataforma web **single-tenant** que permita a un responsable de datos:

1. Registrar y mantener el **Registro de Actividades de Tratamiento (RAT)** — Arts. 14ter + 49.
2. Gestionar **consentimientos** de los titulares — Art. 12.
3. Recibir, tramitar y responder **solicitudes ARCO** dentro del plazo legal — Art. 11.
4. Administrar la organización, sus departamentos y las personas (titulares + colaboradores).
5. Auditar acciones relevantes para demostrar cumplimiento.

---

## 3. Alcance del Proyecto

### Incluido
- Plataforma web completa (admin + portal del titular).
- Cuatro microservicios backend + BFF.
- Dockerización completa para despliegue reproducible.
- Cobertura funcional de las obligaciones principales de Ley 21.719.

### Excluido
- Firma electrónica avanzada.
- Notificaciones por email/SMS.
- Multi-tenancy (diseño intencionalmente single-tenant).
- Integración con Google OAuth (fuera del alcance académico).
- API Gateway / Service Discovery (Eureka).

---

## 4. Usuarios del Sistema

| Rol | Descripción | Permisos clave |
|---|---|---|
| **SUPER_ADMIN** | Administrador de la plataforma. Acceso total. | Todos |
| **ORG_ADMIN** | Responsable de datos dentro de la organización. | USER_VIEW/CREATE, ROLE_VIEW/ASSIGN, ARCO_*, RAT_*, AUDIT_VIEW |
| **ANALYST** | Analista de cumplimiento. Gestiona RAT y ARCO. | ARCO_VIEW/CREATE/RESOLVE, RAT_VIEW/CREATE/UPDATE/EXPORT |
| **AUDITOR** | Auditor interno o externo. Solo lectura. | AUDIT_VIEW |
| **END_USER** | Titular de datos. Accede al portal propio. | ARCO_VIEW/CREATE |

---

## 5. Arquitectura

```
Browser :5173 (React/Vite)
    └── Vite proxy /api ──→ BFF :8085 (Spring Boot)
            ├── /auth/**          → Auth-service      :8080 → postgres-auth      :5436
            ├── /organizations/** → Org-service       :8081 → postgres-org       :5433
            ├── /arco/**          → Arco-service      :8082 → postgres-arco      :5434
            └── /compliance/**    → Compliance-service :8083 → postgres-compliance :5435
```

**BFF:** proxy manual (sin auth propia). Reenvía el header `Authorization` a cada microservicio. Cada nuevo endpoint requiere agregar: `Client → Service → Controller` en el BFF.

**Auth:** JWT en `sessionStorage` → interceptor axios en `api.ts` → `@PreAuthorize` en controllers.

---

## 6. Modelo de Datos (resumen)

```
Organization
  └── Department
  └── Person  (titular o colaborador)

User  [auth-service]
  ├── organizationId → Organization.id
  ├── personId       → Person.id
  └── roles          → Role → permissions

TreatmentActivity (RAT)  [compliance-service]
  ├── organizationId
  ├── legalBasis      (CONSENTIMIENTO | CONTRATO | OBLIGACION_LEGAL | ...)
  └── dataCategories  → DataCategory (catálogo 20 items, Art. 2g)
       └── sensitive: boolean

Consent  [compliance-service]
  ├── organizationId
  └── dataSubjectId  → Person.id

ArcoRequest  [arco-service]
  ├── organizationId
  ├── dataSubjectId  → Person.id
  ├── type           (ACCESO | RECTIFICACION | CANCELACION | OPOSICION)
  ├── status         (RECIBIDA → EN_REVISION → ... → RESPONDIDA | RECHAZADA)
  └── dueDate        = submittedAt + 30 días  (Art. 11)
```

---

## 7. Módulos Funcionales

### 7.1 Autenticación (`/login`)
- Login con email/contraseña → JWT.
- `/auth/me` devuelve perfil + `organizationId` (nunca hardcodeado en frontend).
- Redirección automática al portal del titular si rol es `END_USER`.
- **Pendiente:** flujo "primer login" para usuarios PENDING → completar perfil.

### 7.2 Dashboard (`/dashboard`)
- KPIs: solicitudes ARCO pendientes, consentimientos activos, actividades RAT vigentes.
- **Estado actual:** página placeholder — requiere conectar con datos reales de los servicios.

### 7.3 Titulares (`/titulares`)
- Listado de personas registradas en la organización.
- Filtro por departamento, estado.
- **Pendiente:** conectar con Organization-service (`GET /organizations/{id}/persons`).

### 7.4 Consentimientos (`/consentimientos`)
- Listado de consentimientos por titular.
- Ver detalle: propósito, categorías de datos, fecha otorgamiento/revocación.
- **Pendiente:** conectar con Compliance-service (`GET /compliance/consents`).

### 7.5 Solicitudes ARCO (`/arco`)
- Listado con filtros por estado y tipo.
- Crear solicitud (accesible para END_USER desde el portal).
- Cambiar estado con comentario (ANALYST/ORG_ADMIN).
- Plazo visible: días restantes hasta `dueDate` (30 días corridos, Art. 11).
- **Pendiente:** conectar ARCO frontend con Arco-service vía BFF.

### 7.6 RAT — Registro de Actividades de Tratamiento (`/rat`)
- Crear/editar actividades de tratamiento.
- Asociar categorías de datos (catálogo 20 items Art. 2g), marcar sensibles.
- Indicar base legal (`LegalBasis` enum), período de retención, destinatarios.
- **Estado actual:** backend completo (Compliance-service). Frontend pendiente.

### 7.7 Auditoría (`/auditoria`)
- Log de acciones: quién hizo qué y cuándo.
- **Estado actual:** página placeholder. Requiere definir modelo de auditoría.

### 7.8 Mi Organización (`/admin/organizacion`) ✅
- Ver y editar datos de la organización (nombre, RUT, email, tipo).
- Gestionar departamentos: crear, activar/desactivar.
- **Estado actual:** operativo, conectado a Organization-service.

### 7.9 Usuarios (`/admin/usuarios`)
- Listar usuarios con rol y estado.
- Registrar nuevo usuario (admin ingresa email + departamento → usuario PENDING → completa perfil en primer login).
- Asignar/cambiar rol.
- **Estado actual:** página scaffolded. Requiere flujo de invitación + primer login.

### 7.10 Roles y Permisos (`/admin/roles`)
- Ver roles existentes y sus permisos asignados.
- Crear rol personalizado.
- Asignar/remover permisos de un rol.
- **Estado actual:** página scaffolded. Backend Auth-service completo.

### 7.11 Portal del Titular (`/portal`)
- Inicio: resumen de consentimientos y solicitudes propias.
- Nueva solicitud ARCO.
- Seguimiento de estado de solicitudes existentes.
- Ver/revocar consentimientos propios.
- **Estado actual:** layout y componentes creados. Requiere conectar con backend.

---

## 8. Flujos Principales

### Registro de persona / invitación
```
ORG_ADMIN ingresa email + departamento + rol
    → POST /auth/invite  (crea Person en Org-service + User[PENDING] en Auth-service)
    → Usuario recibe credenciales temporales (o accede con contraseña provisional)
    → Primer login → detecta status=PENDING → redirige a /completar-perfil
    → Usuario completa nombre, RUT, etc. → status=ACTIVE
```

### Solicitud ARCO (flujo completo)
```
Titular en /portal → Nueva solicitud
    → POST /arco  (status=RECIBIDA, dueDate=hoy+30)
    → ANALYST recibe notificación (a futuro)
    → ANALYST cambia estado: EN_REVISION → IDENTIDAD_VERIFICADA → EN_GESTION
    → ANALYST responde → status=RESPONDIDA
    → Titular ve respuesta en /portal/seguimiento
```

### Registro RAT
```
ANALYST/ORG_ADMIN → /rat → Nueva actividad
    → Nombre, propósito, base legal
    → Selecciona categorías de datos (muestra si son sensibles automáticamente)
    → Indica sistemas, destinatarios, retención
    → status=ACTIVA → aparece en RAT exportable
```

---

## 9. Requisitos No Funcionales

| Atributo | Requerimiento |
|---|---|
| **Seguridad** | JWT firmado, `@PreAuthorize` por endpoint, contraseñas con BCrypt |
| **Trazabilidad** | `createdAt`/`updatedAt` en todas las entidades |
| **Mantenibilidad** | Patrón uniforme: Controller → Service → Repository + DTO en/salida |
| **Portabilidad** | Docker Compose completo, variables de entorno para configuración sensible |
| **Ley 21.719** | Plazo ARCO 30 días corridos, categorías sensibles Art. 2g, bases legales Arts. 12-13 |

---

## 10. Estado de Implementación

| Módulo | Backend | Frontend |
|---|---|---|
| Auth (login, JWT, roles, permisos) | ✅ Completo | ✅ Login operativo |
| Mi Organización + Departamentos | ✅ Completo | ✅ Operativo |
| Gestión de Usuarios | ✅ Endpoints | 🔄 Scaffolded |
| Gestión de Roles/Permisos | ✅ Endpoints | 🔄 Scaffolded |
| RAT (actividades de tratamiento) | ✅ Completo | ❌ Pendiente |
| Consentimientos | ✅ Modelo/endpoints | ❌ Pendiente |
| Solicitudes ARCO | ✅ Completo | 🔄 Scaffolded |
| Portal del Titular | N/A | 🔄 Layout listo |
| Dashboard | N/A | ❌ Solo placeholder |
| Auditoría | ❌ Pendiente | ❌ Pendiente |
| Flujo invitación / primer login | ❌ Pendiente | ❌ Pendiente |

---

## 11. Roadmap Pendiente (priorizado)

### P1 — Crítico para demo funcional
1. **Flujo invitación de personas:** `POST /auth/invite` + UI "Agregar persona" en MiOrganización + página completar perfil.
2. **Página RAT:** formulario crear/editar actividad + tabla listado con estado.
3. **Conectar ARCO frontend:** tabla + modal cambio de estado + portal del titular.

### P2 — Completar cobertura funcional
4. **Página Consentimientos:** listado por titular + detalle.
5. **Página Usuarios:** búsqueda, asignación de rol, activar/desactivar.
6. **Página Roles/Permisos:** UI para gestionar permisos por rol.
7. **Dashboard real:** KPIs con datos de los servicios.

### P3 — Calidad y cierre académico
8. **Módulo de Auditoría:** log de acciones en DB + página de consulta.
9. **Exportación RAT:** PDF/Excel con actividades activas.
10. **Portal titular completo:** consentimientos + seguimiento ARCO.

---

## 12. Decisiones de Diseño Relevantes

- **Single-tenant por diseño:** una organización por despliegue. `organizationId` hardcodeado en `application.properties`, no en código de aplicación.
- **JdbcTemplate para seed con UUID fijo:** `@GeneratedValue` de JPA causa `PersistentObjectException` con IDs pre-establecidos. Solución definitiva: `JdbcTemplate` con `INSERT ... ON CONFLICT (id) DO NOTHING`.
- **organizationId en frontend desde JWT:** nunca hardcodeado. Se lee de `useAuth().getUser().organizationId` que viene de `/auth/me`.
- **BFF sin lógica de negocio:** solo proxy + reenvío de Authorization header. Toda la lógica vive en los microservicios.
- **`ddl-auto=update` durante desarrollo:** facilita iteración. Para producción se recomienda migrar a Flyway.

---

## 13. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18, TypeScript, Vite, TanStack Query, React Router v6, shadcn/ui, Tailwind CSS |
| Backend | Java 21, Spring Boot 3, Spring Security, Spring Data JPA, Lombok, JWT |
| Base de datos | PostgreSQL 16 (instancia independiente por servicio) |
| DevOps | Docker, Docker Compose |
| Build | Maven (backend), npm (frontend) |

---

## 14. Equipo

- Arelis Tovar
- Camilo Queupil
- Wilfred Vinet

**Contexto académico:** Proyecto de título, Duoc UC. Orientado a demostrar arquitectura de microservicios aplicada al cumplimiento normativo chileno.
