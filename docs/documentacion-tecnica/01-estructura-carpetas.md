# Estructura de Carpetas — PrivData

Monorepo con 4 microservicios Spring Boot + 1 BFF + 1 frontend React, cada backend con su propia base de datos PostgreSQL (single-tenant, Ley 21.719).

---

## 1. Raíz del repositorio

```
Privdata-docker/
├── docker-compose.yaml     # Orquesta DBs, microservicios, BFF, frontend y mailhog
├── CLAUDE.md                # Guía de arquitectura y convenciones para asistentes IA
├── README.md
├── inicio.md
├── OPPOSITION_PROMPT.md      # Notas/prompt sobre el flujo de Oposición ARCO
├── docs/                     # Documentación del proyecto
│   ├── PRD.md                       # Product Requirements Document
│   ├── bff-contratos-y-dtos.md      # Contratos/DTOs del BFF
│   ├── sesion-2026-06-10.md         # Notas de sesión de trabajo
│   └── documentacion-tecnica/       # Documentación técnica de referencia (esta carpeta)
│       ├── 01-estructura-carpetas.md
│       ├── 02-requisitos.md
│       ├── 03-endpoints.md
│       └── 04-modelo-bd.md
├── Auth-service/             # Microservicio de autenticación — :8080 — postgres-auth :5436
├── Organization-service/     # Microservicio de organización — :8081 — postgres-organization :5433
├── Arco-service/             # Microservicio de solicitudes ARCO — :8082 — postgres-arco :5434
├── Compliance-service/       # Microservicio de cumplimiento (RAT/Consentimientos) — :8083 — postgres-compliance :5435
├── bff-api/                  # Backend-for-Frontend — :8085
└── Frontend-Privdata/        # SPA React/Vite — :5173
```

---

## 2. Patrón común de los microservicios Spring Boot

Todos los servicios backend (`Auth-service`, `Organization-service`, `Arco-service`, `Compliance-service`, `bff-api`) siguen la misma convención de capas dentro de `src/main/java/<package-base>/`:

| Carpeta | Contenido | Descripción |
|---|---|---|
| `config/` | `SecurityConfig`, `DataInitializer`, `*Properties` | Configuración de seguridad, seed de datos al iniciar (roles, permisos, organización, categorías), propiedades externas (`application.properties`) |
| `controller/` | `*Controller.java` | Endpoints REST, anotados con `@RestController`, `@RequestMapping`, `@PreAuthorize` |
| `service/` | `*Service.java` | Lógica de negocio |
| `repository/` | `*Repository.java` | Interfaces `JpaRepository` |
| `model/` | Entidades JPA (`@Entity`) | Tablas de la base de datos del servicio |
| `model/enums/` o `enums/` | Enums Java | Estados, tipos, categorías persistidos como `STRING` |
| `dto/request/` | DTOs de entrada | Cuerpos de petición (`record` o clases) |
| `dto/response/` | DTOs de salida | Cuerpos de respuesta |
| `shared/` | `ApiResponseDTO<T>` | Envoltorio uniforme de respuesta `{ success, message, data }` |
| `exception/` | Excepciones y handlers | Manejo centralizado de errores |
| `mapper/` | Mappers entidad ↔ DTO | (presente en Auth-service) |
| `security/` | Filtros JWT, `SecurityUser` | (presente en Auth-service) |
| `util/` | Utilidades varias | (presente en Arco-service y bff-api) |

---

## 3. Auth-service (`:8080`, BD `auth_db`)

```
Auth-service/src/main/java/com/privdata/authservice/
├── config/         # DataInitializer (seed roles/permisos/SUPER_ADMIN), SecurityConfig, AdminProperties
├── controller/      # AuthController, AuditLogController, PasswordResetController,
│                    # NotificationController, HealthController, TestSecurityController
├── dto/             # request/ y response/ (Login, Register, Invite, AssignRole, Audit, Password, Notification...)
├── enums/           # UserStatus (PENDING, ACTIVE, BLOCKED, INACTVE)
├── exception/       # Manejo de errores (credenciales inválidas, usuario no encontrado, etc.)
├── mapper/          # Mapeo User/Role/Permission ↔ DTOs
├── model/           # User, Role, Permission, UserRole, RolePermissions, RefreshToken, AuditLog, PasswordResetCode
├── repository/      # JpaRepository de cada entidad
├── security/        # JWT filter, SecurityUser (UserDetails)
├── service/         # AuthService, AuditLogService, PasswordResetService, NotificationService...
└── shared/          # ApiResponseDTO<T>
```

Responsabilidad: autenticación (JWT), gestión de usuarios/roles/permisos, auditoría, recuperación de contraseña, notificaciones de resolución ARCO.

---

## 4. Organization-service (`:8081`, BD `organization_db`)

```
Organization-service/src/main/java/cl/privdata/organizationService/
├── config/          # DataInitializer (seed organización vía JdbcTemplate), SecurityConfig
├── controller/       # OrganizationController, DepartmentController, PersonController,
│                     # OrganizationSettingsController, HealthController
├── dto/              # request/ y response/ por entidad
├── enums/            # DataStatus (ACTIVE, BLOCKED, DELETION_REQUESTED, ANONYMIZED)
├── model/            # Organization, Department, Person, OrganizationSettings
├── repository/       # JpaRepository de cada entidad
└── service/          # Lógica de negocio (incluye bloqueo/eliminación/anonimización ARCO de Person)
```

Responsabilidad: datos maestros de la organización, departamentos, personas (titulares/colaboradores) y ejecución de derechos ARCO sobre `Person` (bloquear, eliminar, anonimizar).

---

## 5. Arco-service (`:8082`, BD `arco_db`)

```
Arco-service/src/main/java/com/example/demo/
├── arco/            # Submódulo de flujos ARCO específicos (p. ej. opposition)
├── client/          # Clientes HTTP hacia otros servicios (si aplica)
├── config/          # SecurityConfig
├── controller/      # ArcoRequestController, ArcoRequestActionsController,
│                    # ArcoRequestEvidencesController, ArcoRequestStatusHistoryController, HealthController
├── dto/             # request/ y response/ (ArcoRequest, Actions, Evidences, StatusHistory, Cancellation)
├── enums/           # ArcoStatus, ArcoRequestType, ArcoRequestChannel, ArcoIdentityVerificationStatus,
│                    # ArcoCancellationType, ArcoActionType, ArcoEvidenceType, ArcoFileType, ArcoHistoryStatus
├── exception/       # Manejo de errores
├── model/           # ArcoRequest, ArcoRequestActions, ArcoRequestEvidences, ArcoRequestStatusHistory
├── repository/      # JpaRepository de cada entidad
├── service/         # Lógica de negocio: plazos (Art. 11), cambios de estado, ejecución de cancelación
├── shared/          # ApiResponseDTO<T>
└── util/            # Utilidades (cálculo de fechas, etc.)
```

Responsabilidad: ciclo de vida completo de las solicitudes ARCO (Acceso, Rectificación, Cancelación, Oposición, Portabilidad), historial de estados, evidencias y acciones ejecutadas.

---

## 6. Compliance-service (`:8083`, BD `compliance_db`)

```
Compliance-service/src/main/java/cl/privdata/complianceService/
├── DTO/             # Request/response DTOs (Consent, ConsentDefinition, TreatmentActivity, DataCategory)
├── config/          # DataCategorySeeder (seed 20 categorías Art. 2g), SecurityConfig
├── controller/      # ConsentController, ConsentDefinitionController, DataCategoryController,
│                    # TreatmentActivityController, HealthController
├── model/           # TreatmentActivity, DataCategory, TreatmentActivityDataCategory,
│                    # ConsentDefinition, Consent, ConsentDataCategory, ConsentEvent
│                    # (incluye enums: LegalBasis, TreatmentActivityStatus, ConsentStatus,
│                    #  CollectionMethod, ConsentEventType)
├── repository/      # JpaRepository de cada entidad
└── service/         # Lógica de negocio RAT y consentimientos
```

Responsabilidad: Registro de Actividades de Tratamiento (RAT, Arts. 14ter + 49), catálogo de categorías de datos (Art. 2g), definiciones y gestión de consentimientos (Art. 12).

---

## 7. bff-api (`:8085`)

```
bff-api/src/main/java/com/privdata/bff_api/
├── client/          # AuthClient, OrganizationClient, ArcoClient, ComplianceClient (helper forward())
├── config/          # Configuración de URLs de servicios downstream, CORS
├── controller/      # AuthBffController, OrganizationBffController, ArcoBffController,
│                    # ComplianceBffController, ArcoProxyController
├── dtos/            # DTOs compartidos para orquestación (p. ej. invitePerson, cancelación ARCO)
├── service/         # Servicios que orquestan llamadas a múltiples microservicios
└── util/            # Utilidades (forward de headers, mapeo de respuestas)
```

Responsabilidad: proxy sin lógica de negocio propia — reenvía `Authorization` y orquesta llamadas cruzadas (p. ej. invitar persona = crear `Person` + crear `User PENDING`; ejecutar cancelación ARCO = bloquear/eliminar/anonimizar `Person` + cerrar `ArcoRequest`).

---

## 8. Frontend-Privdata (`:5173`)

```
Frontend-Privdata/src/
├── assets/           # Recursos estáticos (imágenes, íconos)
├── components/
│   ├── AppLayout.tsx          # Layout principal (sidebar + contenido) para el panel admin
│   ├── AppSidebar.tsx         # Navegación lateral según permisos del usuario
│   ├── NavLink.tsx             # Enlace de navegación con estado activo
│   ├── RequirePermission.tsx   # Wrapper que oculta/bloquea UI según permisos
│   ├── StatusBadge.tsx          # Badge visual para estados (ARCO, Consent, etc.)
│   ├── arco/                    # Paneles específicos de flujos ARCO
│   │   ├── ArcoAccessReport.tsx       # Reporte de derecho de Acceso
│   │   ├── ArcoBlockingPanel.tsx      # Panel de bloqueo (Cancelación)
│   │   ├── ArcoOppositionPanel.tsx    # Panel de Oposición
│   │   ├── ArcoPortabilityPanel.tsx   # Panel de Portabilidad
│   │   ├── ArcoRectificationPanel.tsx # Panel de Rectificación
│   │   └── ArcoSuppressionPanel.tsx   # Panel de Supresión (Cancelación)
│   ├── titular/                 # Componentes del portal del titular
│   │   ├── TitularArco.tsx
│   │   ├── TitularConsentimientos.tsx
│   │   ├── TitularInicio.tsx
│   │   ├── TitularPortalLayout.tsx
│   │   └── TitularSeguimiento.tsx
│   └── ui/                       # Componentes base shadcn/ui (button, card, input, table, badge...)
├── hooks/             # use-mobile y otros hooks compartidos
├── lib/
│   ├── api.ts          # Cliente axios + funciones tipadas por dominio (authApi, arcoApi, complianceApi...)
│   ├── blocking.ts      # Lógica/helpers del flujo de bloqueo (Cancelación)
│   ├── opposition.ts     # Lógica/helpers del flujo de Oposición
│   ├── rectification.ts   # Lógica/helpers del flujo de Rectificación
│   ├── suppression.ts     # Lógica/helpers del flujo de Supresión
│   ├── mock-data.ts        # Datos simulados para páginas aún no conectadas
│   └── utils.ts             # Utilidades genéricas (cn, formateo, etc.)
├── pages/
│   ├── LoginPage.tsx
│   ├── ForgotPasswordPage.tsx
│   ├── NotFound.tsx
│   ├── admin/                  # Panel administrativo
│   │   ├── DashboardPage.tsx
│   │   ├── TitularesPage.tsx
│   │   ├── ConsentsPage.tsx
│   │   ├── ArcoPage.tsx
│   │   ├── AuditPage.tsx
│   │   ├── MiOrganizacionPage.tsx
│   │   ├── RolesPage.tsx
│   │   └── UsersPage.tsx
│   └── titular/                 # Portal del titular
│       ├── TitularPortalPage.tsx
│       └── CompleteProfilePage.tsx
└── types/             # Tipos TS por dominio: arco.ts, audit.ts, auth.ts, compliance.ts, organization.ts, person.ts
```

Responsabilidad: SPA con panel administrativo (gestión de organización, usuarios, roles, ARCO, consentimientos, RAT, auditoría) y portal del titular (solicitudes ARCO propias, consentimientos, seguimiento).
