# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PrivData is an academic data privacy management system built for Chilean **Ley 21.719** compliance. It is a single-tenant microservices application — one organization per deployment.

---

## Architecture

```
Frontend (React/Vite :5173)
    └── Vite proxy /api → BFF (:8085)
            ├── Auth-service      (:8080) → postgres-auth      (:5436)
            ├── Organization-service (:8081) → postgres-organization (:5433)
            ├── Arco-service      (:8082) → postgres-arco      (:5434)
            └── Compliance-service (:8083) → postgres-compliance (:5435)
```

**BFF** (`bff-api`) is a manually-proxied Backend-for-Frontend — it has no auth logic of its own, just forwards requests with the `Authorization` header to the appropriate microservice. Every new microservice endpoint requires adding to: `client/`, `service/`, and `controller/` in the BFF.

**Auth flow:** JWT stored in `sessionStorage` → attached by axios interceptor in `src/lib/api.ts` → BFF forwards to Auth-service → permissions checked via `@PreAuthorize("hasAuthority('PERMISSION_NAME')")`.

**Single-tenant design:** The `organizationId` (`a81476a6-7acc-4740-b254-1ce685d17762`) is seeded at startup by each service's `DataInitializer`. The frontend derives `organizationId` from `/auth/me` response — never hardcode it in the frontend.

---

## Running Services Locally (Development)

Each Spring Boot service runs independently. Start the databases first:

```bash
# Start only the databases needed
docker-compose up -d postgres-auth postgres-organization postgres-arco postgres-compliance
```

Then run each service from its folder:

```bash
cd Auth-service && ./mvnw spring-boot:run          # :8080
cd Organization-service && ./mvnw spring-boot:run  # :8081
cd Arco-service && ./mvnw spring-boot:run          # :8082
cd Compliance-service && ./mvnw spring-boot:run    # :8083
cd bff-api && ./mvnw spring-boot:run               # :8085
```

Frontend:
```bash
cd Frontend-Privdata && npm run dev   # :5173
```

### Default credentials
- **Email:** `admin@privdata.cl`
- **Password:** `Admin1234!`
- Seeded by `Auth-service/DataInitializer` on first startup (uses `PasswordEncoder` — no raw hash).

---

## Frontend Commands

```bash
cd Frontend-Privdata
npm run dev      # dev server with HMR
npm run build    # tsc + vite build
npm run lint     # eslint
npm run preview  # preview production build
```

All API calls go through `/api` prefix → Vite proxies to BFF at `http://localhost:8085`. Configured in `vite.config.ts`.

---

## Spring Boot Service Structure

All services follow the same pattern:

```
src/main/java/.../
  config/          DataInitializer (seed on startup), Security, Properties
  controller/      REST endpoints
  service/         Business logic
  repository/      JPA repositories
  model/           JPA entities
  model/enums/     Enums
  dto/request/     Request bodies
  dto/response/    Response bodies
  shared/          ApiResponseDTO<T> wrapper
```

**Response envelope** used everywhere:
```java
{ "success": boolean, "message": string, "data": T }
```

**Authorization:** `SecurityConfig` uses `@EnableMethodSecurity` — permissions are enforced at the controller method level with `@PreAuthorize("hasAuthority('MODULE_ACTION')")`. Permissions are seeded by `Auth-service/DataInitializer`.

---

## Key Data Model Relationships

```
Organization (org-service)
  └── Department (org-service)
  └── Person (org-service) — the "titular" or staff member

User (auth-service)
  ├── organizationId → Organization.id
  ├── personId      → Person.id
  └── UserRole      → Role → RolePermissions → Permission

TreatmentActivity / RAT (compliance-service)
  ├── organizationId
  └── TreatmentActivityDataCategory → DataCategory (seeded catalog)

Consent (compliance-service)
  ├── organizationId
  └── dataSubjectId → Person.id

ArcoRequest (arco-service)
  ├── organizationId
  ├── dataSubjectId → Person.id
  └── dueDate = submittedAt + 30 days (Art. 11 Ley 21.719)
```

---

## Seeding & Initialization

**Auth-service** seeds roles, permissions, role-permissions, and SUPER_ADMIN user on every startup via `DataInitializer implements CommandLineRunner`. Credentials read from `AdminProperties` (`admin.*` in `application.properties`, overridable via env vars `ADMIN_EMAIL`, `ADMIN_PASSWORD`).

**Organization-service** seeds the default organization via `DataInitializer implements ApplicationRunner` using `JdbcTemplate` with `INSERT ... ON CONFLICT (id) DO NOTHING`. The org UUID must match `admin.organization-id` in Auth-service. **Do not use `repository.save()` or `entityManager.persist()` with a pre-set UUID** — use `JdbcTemplate` to avoid JPA `@GeneratedValue` conflicts.

**Compliance-service** seeds 20 `DataCategory` entries (9 non-sensitive, 11 sensitive per Art. 2g Ley 21.719) via `DataCategorySeeder implements ApplicationRunner`.

---

## Adding a New Endpoint (full stack)

1. **Microservice:** add controller method with `@PreAuthorize`
2. **BFF client:** add method to `XxxClient.java` using `forward()` helper
3. **BFF service:** delegate to client
4. **BFF controller:** expose endpoint, forward `Authorization` header
5. **Frontend `api.ts`:** add typed function to the relevant `xxxApi` object

---

## Resetting a Database

```bash
docker stop privdata-postgres-auth
docker rm privdata-postgres-auth
docker volume rm privdata-docker_postgres_auth_data
docker-compose up -d postgres-auth
# Then restart Auth-service so DataInitializer runs
```

---

## Permissions Reference

| Permission | Who has it |
|---|---|
| `USER_VIEW` / `USER_CREATE` | SUPER_ADMIN, ORG_ADMIN |
| `ROLE_VIEW` / `ROLE_ASSIGN` | SUPER_ADMIN, ORG_ADMIN |
| `ARCO_VIEW` / `ARCO_CREATE` / `ARCO_RESOLVE` | SUPER_ADMIN, ORG_ADMIN, ANALYST |
| `RAT_VIEW` / `RAT_CREATE` / `RAT_UPDATE` / `RAT_EXPORT` | SUPER_ADMIN, ORG_ADMIN, ANALYST |
| `AUDIT_VIEW` | SUPER_ADMIN, ORG_ADMIN, AUDITOR |

`END_USER` role has only `ARCO_VIEW` and `ARCO_CREATE` (titular portal access).

---

## Law 21.719 Implementation Notes

- **ARCO deadline:** 30 calendar days from submission (`dueDate = submittedAt + 30 days`), extendable once by 30 more (Art. 11).
- **RAT** (`TreatmentActivity`) maps to Arts. 14ter + 49 — not a formal GDPR Art. 30 equivalent but derived from transparency and compliance program obligations.
- **Sensitive data** categories are flagged with `sensitive: true` in `DataCategory` — treatment activities containing them have `containsSensitiveData: true` computed automatically.
- **Legal bases** (`LegalBasis` enum): `CONSENTIMIENTO` (Art. 12), `CONTRATO`, `OBLIGACION_LEGAL`, `INTERES_LEGITIMO`, `INTERES_VITAL`, `FUNCION_PUBLICA` (Arts. 13, 20).
