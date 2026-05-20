# PrivData

Plataforma orientada al cumplimiento de la Ley 21.719 de Protección de Datos Personales en Chile, basada en arquitectura de microservicios.

## Descripción del proyecto

PrivData es una plataforma diseñada para ayudar a organizaciones a gestionar el tratamiento de datos personales de manera transparente, trazable y alineada con la normativa chilena.

El sistema permite:

- Gestión de usuarios y autenticación segura.
- Gestión de empresas y titulares de datos.
- Gestión de consentimientos.
- Gestión de solicitudes ARCO.
- Seguimiento de estados de solicitudes.
- Arquitectura basada en microservicios.
- Comunicación centralizada mediante un BFF (Backend For Frontend).

---

# Arquitectura del proyecto

```text
Frontend React
       ↓
BFF API (Spring Boot)
       ↓
-------------------------------------------------
| Auth Service                                  |
| Organization Service                          |
| ARCO Service                                  |
| Compliance Service                            |
-------------------------------------------------
       ↓
PostgreSQL independiente por servicio
```

---

# Microservicios

## Auth Service

Responsable de:

- Autenticación JWT.
- Registro de usuarios.
- Login.
- Gestión de roles.
- Seguridad del sistema.
- Endpoint /me.

Puerto:

```text
8080
```

Base de datos:

```text
auth_db
```

---

## Organization Service

Responsable de:

- Empresas.
- Departamentos.
- Titulares de datos.
- Relación empresa/persona.

Puerto:

```text
8081
```

Base de datos:

```text
organization_db
```

---

## ARCO Service

Responsable de:

- Solicitudes ARCO.
- Seguimiento de estados.
- Trazabilidad.
- Gestión de anonimización.
- Gestión de supresión.
- Gestión de oposición.
- Gestión de rectificación.

Puerto:

```text
8082
```

Base de datos:

```text
arco_db
```

---

## Compliance Service

Responsable de:

- Gestión de consentimientos.
- Finalidades del tratamiento.
- Métodos de recolección.
- Estados de consentimiento.

Puerto:

```text
8083
```

Base de datos:

```text
compliance_db
```

---

## BFF API

Responsable de:

- Centralizar acceso desde frontend.
- Comunicación entre frontend y microservicios.
- Orquestación de flujos.
- Seguridad entre servicios.

Puerto:

```text
8085
```

---

# Tecnologías utilizadas

## Backend

- Java 21
- Spring Boot
- Spring Security
- JWT
- Spring Data JPA
- Hibernate
- Lombok
- Maven

## Frontend

- React
- Vite
- JavaScript

## Base de datos

- PostgreSQL 16

## DevOps

- Docker
- Docker Compose

---

# Estructura del proyecto

```text
PrivData/
│
├── authservice-PrivData/
├── organizationService/
├── Arco-service/
├── complianceService/
├── bff-api/
├── frontend-Privdata-main/
└── docker-compose.yml
```

---

# Dockerización

Cada microservicio cuenta con:

- Dockerfile independiente.
- PostgreSQL independiente.
- Comunicación mediante red Docker.
- Variables de entorno.

---

# Puertos utilizados

| Servicio | Puerto |
|---|---|
| Frontend | 5173 |
| BFF API | 8085 |
| Auth Service | 8080 |
| Organization Service | 8081 |
| ARCO Service | 8082 |
| Compliance Service | 8083 |
| PostgreSQL Auth | 5432 |
| PostgreSQL Organization | 5433 |
| PostgreSQL ARCO | 5434 |
| PostgreSQL Compliance | 5435 |

---

# Levantar el proyecto

## Requisitos

- Docker Desktop
- Git

---

## Clonar repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd PrivData
```

---

## Levantar contenedores

```bash
docker compose up --build
```

---

## Verificar contenedores

```bash
docker ps
```

---

# Endpoints de prueba

## Auth

```text
http://localhost:8085/api/test/auth
```

## Organization

```text
http://localhost:8085/api/test/organization
```

## ARCO

```text
http://localhost:8085/api/test/arco
```

## Compliance

```text
http://localhost:8085/api/test/compliance
```

---

# Desarrollo local

Se recomienda:

```text
Docker → Bases de datos
IntelliJ → Microservicios
```

Levantar solo PostgreSQL:

```bash
docker compose up postgres-auth postgres-organization postgres-arco postgres-compliance
```

Y luego ejecutar los servicios desde IntelliJ.

---

# Estrategia actual de base de datos

Actualmente el proyecto utiliza:

```properties
spring.jpa.hibernate.ddl-auto=update
```

Esto permite:

- Crear tablas automáticamente.
- Actualizar schema durante desarrollo.
- Agilizar iteraciones.

Auth Service además utiliza scripts SQL iniciales para:

- Roles.
- Permisos.
- Usuario administrador.

---

# Futuras mejoras

- API Gateway.
- Eureka Discovery.
- RabbitMQ.
- Auditoría avanzada.
- Logs centralizados.
- Flyway para migraciones.
- Integración con firma electrónica.
- Notificaciones.
- Panel administrativo.
- Dashboard de cumplimiento.

---

# Flujo principal de la plataforma

## Solicitud ARCO

```text
Usuario inicia sesión
↓
Visualiza empresas con acceso a sus datos
↓
Realiza solicitud ARCO
↓
Solicitud queda registrada
↓
Empresa revisa solicitud
↓
Estado cambia según avance
↓
Usuario puede realizar seguimiento
```

---

# Estados de solicitud ARCO

Ejemplo:

```text
RECIBIDA
EN_REVISION
IDENTIDAD_VERIFICADA
EN_GESTION
RESPONDIDA
RECHAZADA
CERRADA
```

---

# Objetivo académico

Proyecto de título enfocado en:

- Arquitectura de microservicios.
- Seguridad.
- Dockerización.
- Integración distribuida.
- Protección de datos.
- Trazabilidad.
- Desarrollo FullStack.

---

# Equipo de desarrollo

- Arelis Tovar
- Camilo Queupil
- Wilfred Vinet


---

# Estado actual

Proyecto en desarrollo activo.

Actualmente:

- Microservicios dockerizados.
- Comunicación BFF ↔ servicios operativa.
- PostgreSQL independiente por servicio.
- Frontend conectado mediante BFF.
- Arquitectura distribuida funcional.

