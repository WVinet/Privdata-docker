# Privdata - AuthService

Microservicio de autenticación y autorización para el proyecto **Privdata**, una plataforma SaaS orientada al cumplimiento de normativas de protección de datos.

Este servicio es el encargado de gestionar la identidad de los usuarios dentro del sistema, incluyendo registro, autenticación y control de acceso basado en roles.

---

##Responsabilidad del servicio

El AuthService centraliza toda la lógica relacionada a seguridad:

- Registro de usuarios
- Inicio de sesión (login)
- Encriptación de contraseñas
- Generación y validación de tokens (JWT)
- Control de acceso basado en roles
- Exposición de información del usuario autenticado (`/auth/me`)

Este servicio será consumido por otros microservicios del sistema para validar identidad y permisos.

---

##Tecnologías utilizadas

- Java 17
- Spring Boot
- Spring Security
- JWT (JSON Web Token)
- PostgreSQL
- JPA / Hibernate
- Maven
- Lombok
- Docker(aun no)

---

##Estructura del proyecto

El proyecto sigue una estructura modular para mantener separación de responsabilidades:
