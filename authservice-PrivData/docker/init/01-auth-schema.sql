-- =========================================
-- PRIVDATA - AUTHSERVICE (MODELO ACTUAL)
-- =========================================

-- =========================================
-- LIMPIEZA DEL ESQUEMA ANTERIOR
-- =========================================

DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

DROP TYPE IF EXISTS company_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- ENUMS
-- =========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'BLOCKED', 'INACTIVE');
END IF;
END
$$;

-- =========================================
-- TABLE: roles
-- =========================================

CREATE TABLE IF NOT EXISTS roles (
                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

-- =========================================
-- TABLE: permissions
-- =========================================

CREATE TABLE IF NOT EXISTS permissions (
                                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module VARCHAR(80) NOT NULL,
    action VARCHAR(80) NOT NULL,
    description VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_permissions_module_action UNIQUE (module, action)
    );

-- =========================================
-- TABLE: users
-- =========================================

CREATE TABLE IF NOT EXISTS users (
                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    person_id UUID NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status user_status NOT NULL DEFAULT 'PENDING',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

-- =========================================
-- TABLE: user_roles
-- =========================================

CREATE TABLE IF NOT EXISTS user_roles (
                                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID,
    expires_at TIMESTAMPTZ,

    CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_user_roles_role
    FOREIGN KEY (role_id)
    REFERENCES roles(id)
    ON DELETE RESTRICT,

    CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role_id)
    );

-- =========================================
-- TABLE: role_permissions
-- =========================================

CREATE TABLE IF NOT EXISTS role_permissions (
                                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_at TIMESTAMPTZ,
    assigned_by UUID,

    CONSTRAINT fk_role_permissions_role
    FOREIGN KEY (role_id)
    REFERENCES roles(id)
    ON DELETE CASCADE,

    CONSTRAINT fk_role_permissions_permission
    FOREIGN KEY (permission_id)
    REFERENCES permissions(id)
    ON DELETE CASCADE,

    CONSTRAINT uq_role_permissions_role_permission UNIQUE (role_id, permission_id)
    );

-- =========================================
-- TABLE: refresh_tokens
-- =========================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
                                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_by_ip TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
    );

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_users_organization_id
    ON users(organization_id);

CREATE INDEX IF NOT EXISTS idx_users_person_id
    ON users(person_id);

CREATE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
    ON user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role_id
    ON user_roles(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id
    ON role_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id
    ON role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
    ON refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at
    ON refresh_tokens(expires_at);

-- =========================================
-- SEED ROLES
-- =========================================

INSERT INTO roles (name, description, active)
VALUES
    ('SUPER_ADMIN', 'Administrador global de la plataforma', TRUE),
    ('ORG_ADMIN', 'Administrador de la organización', TRUE),
    ('ANALYST', 'Usuario analista/operador', TRUE),
    ('AUDITOR', 'Usuario auditor de solo lectura', TRUE),
    ('END_USER', 'Usuario final del sistema', TRUE)
    ON CONFLICT (name) DO NOTHING;

-- =========================================
-- SEED PERMISSIONS
-- =========================================

INSERT INTO permissions (module, action, description, active)
VALUES
    ('USER', 'VIEW', 'Ver usuarios', TRUE),
    ('USER', 'CREATE', 'Crear usuarios', TRUE),
    ('USER', 'UPDATE', 'Actualizar usuarios', TRUE),
    ('USER', 'DELETE', 'Eliminar usuarios', TRUE),

    ('ROLE', 'VIEW', 'Ver roles', TRUE),
    ('ROLE', 'ASSIGN', 'Asignar roles', TRUE),

    ('PERMISSION', 'VIEW', 'Ver permisos', TRUE),

    ('ARCO', 'VIEW', 'Ver solicitudes ARCO', TRUE),
    ('ARCO', 'CREATE', 'Crear solicitudes ARCO', TRUE),
    ('ARCO', 'RESOLVE', 'Resolver solicitudes ARCO', TRUE),

    ('RAT', 'VIEW', 'Ver registros RAT', TRUE),
    ('RAT', 'CREATE', 'Crear registros RAT', TRUE),
    ('RAT', 'UPDATE', 'Actualizar registros RAT', TRUE),
    ('RAT', 'EXPORT', 'Exportar registros RAT', TRUE),

    ('AUDIT', 'VIEW', 'Ver auditorías', TRUE)
    ON CONFLICT (module, action) DO NOTHING;

-- =========================================
-- SEED ROLE_PERMISSIONS
-- =========================================

INSERT INTO role_permissions (role_id, permission_id, active, assigned_at)
SELECT r.id, p.id, TRUE, NOW()
FROM roles r
         CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, active, assigned_at)
SELECT r.id, p.id, TRUE, NOW()
FROM roles r
         JOIN permissions p
              ON (p.module, p.action) IN (
                                          ('USER', 'VIEW'),
                                          ('USER', 'CREATE'),
                                          ('USER', 'UPDATE'),
                                          ('ROLE', 'VIEW'),
                                          ('ROLE', 'ASSIGN'),
                                          ('ARCO', 'VIEW'),
                                          ('ARCO', 'CREATE'),
                                          ('ARCO', 'RESOLVE'),
                                          ('RAT', 'VIEW'),
                                          ('RAT', 'CREATE'),
                                          ('RAT', 'UPDATE'),
                                          ('RAT', 'EXPORT'),
                                          ('AUDIT', 'VIEW')
                  )
WHERE r.name = 'ORG_ADMIN'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, active, assigned_at)
SELECT r.id, p.id, TRUE, NOW()
FROM roles r
         JOIN permissions p
              ON (p.module, p.action) IN (
                                          ('ARCO', 'VIEW'),
                                          ('ARCO', 'CREATE'),
                                          ('ARCO', 'RESOLVE'),
                                          ('RAT', 'VIEW'),
                                          ('RAT', 'CREATE'),
                                          ('RAT', 'UPDATE')
                  )
WHERE r.name = 'ANALYST'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, active, assigned_at)
SELECT r.id, p.id, TRUE, NOW()
FROM roles r
         JOIN permissions p
              ON (p.module, p.action) IN (
                                          ('AUDIT', 'VIEW'),
                                          ('ARCO', 'VIEW'),
                                          ('RAT', 'VIEW'),
                                          ('USER', 'VIEW'),
                                          ('ROLE', 'VIEW'),
                                          ('PERMISSION', 'VIEW')
                  )
WHERE r.name = 'AUDITOR'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id, active, assigned_at)
SELECT r.id, p.id, TRUE, NOW()
FROM roles r
         JOIN permissions p
              ON (p.module, p.action) IN (
                                          ('ARCO', 'VIEW'),
                                          ('ARCO', 'CREATE')
                  )
WHERE r.name = 'END_USER'
    ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =========================================
-- USUARIOS DE PRUEBA
-- =========================================
-- OJO:
-- Estos hashes deben coincidir con BCrypt de Spring.
-- Si admin no puede iniciar sesión, usa la alternativa debajo.

INSERT INTO users (
    organization_id,
    person_id,
    email,
    password_hash,
    status,
    active,
    failed_login_attempts,
    created_at,
    updated_at
)
VALUES (
           '11111111-1111-1111-1111-111111111111',
           '22222222-2222-2222-2222-222222222222',
           'user@privdata.cl',
           '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqC8z1g7s5Q9M/dwZ0pniS3pSkeCZK',
           'ACTIVE',
           TRUE,
           0,
           NOW(),
           NOW()
       )
    ON CONFLICT (email) DO NOTHING;

-- Usuario admin fijo
INSERT INTO users (
    organization_id,
    person_id,
    email,
    password_hash,
    status,
    active,
    failed_login_attempts,
    created_at,
    updated_at
)
VALUES (
           '11111111-1111-1111-1111-111111111111',
           '99999999-9999-9999-9999-999999999999',
           'admin@privdata.cl',
           '$2a$10$N9qo8uLOickgx2ZMRZoMy.MrqC8z1g7s5Q9M/dwZ0pniS3pSkeCZK',
           'ACTIVE',
           TRUE,
           0,
           NOW(),
           NOW()
       )
    ON CONFLICT (email) DO NOTHING;


-- =========================================
-- ASIGNACIÓN DE ROLES
-- =========================================

INSERT INTO user_roles (user_id, role_id, active, assigned_at)
SELECT u.id, r.id, TRUE, NOW()
FROM users u
         JOIN roles r ON r.name = 'END_USER'
WHERE u.email = 'user@privdata.cl'
    ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, active, assigned_at)
SELECT u.id, r.id, TRUE, NOW()
FROM users u
         JOIN roles r ON r.name = 'SUPER_ADMIN'
WHERE u.email = 'admin@privdata.cl'
    ON CONFLICT (user_id, role_id) DO NOTHING;

-- =========================================
-- CONSULTAS ÚTILES
-- =========================================

-- SELECT id, name, description, active FROM roles ORDER BY name;
-- SELECT id, module, action, description, active FROM permissions ORDER BY module, action;
-- SELECT id, organization_id, person_id, email, status, active FROM users;
-- SELECT u.email, r.name AS role_name
-- FROM users u
-- JOIN user_roles ur ON ur.user_id = u.id
-- JOIN roles r ON r.id = ur.role_id
-- ORDER BY u.email, r.name;