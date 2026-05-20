-- ============================================================
-- PRIVDATA — organizationService
-- BASE DE DATOS: organization_db
-- PostgreSQL 16 · Generado desde modelos JPA
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- LIMPIEZA
-- ------------------------------------------------------------

DROP TABLE IF EXISTS organization_settings CASCADE;
DROP TABLE IF EXISTS persons              CASCADE;
DROP TABLE IF EXISTS departments          CASCADE;
DROP TABLE IF EXISTS organizations        CASCADE;

-- ------------------------------------------------------------
-- TABLE: organizations
-- ------------------------------------------------------------

CREATE TABLE organizations (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    legal_name    VARCHAR(255),
    rut           VARCHAR(20)  UNIQUE,
    business_type VARCHAR(100),
    email         VARCHAR(255),
    phone         VARCHAR(50),
    address       VARCHAR(500),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  organizations           IS 'Organizaciones responsables del tratamiento de datos personales.';
COMMENT ON COLUMN organizations.rut       IS 'RUT chileno único de la organización.';
COMMENT ON COLUMN organizations.is_active IS 'Soft-delete / habilitación de la organización.';

-- ------------------------------------------------------------
-- TABLE: departments
-- ------------------------------------------------------------

CREATE TABLE departments (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID         NOT NULL,
    name            VARCHAR(150) NOT NULL,
    description     VARCHAR(255),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_departments_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,

    CONSTRAINT uq_departments_org_name
        UNIQUE (organization_id, name)
);

COMMENT ON TABLE departments IS 'Departamentos o áreas dentro de una organización.';

-- ------------------------------------------------------------
-- TABLE: persons
-- ------------------------------------------------------------

CREATE TABLE persons (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID         NOT NULL,
    department_id   UUID,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    full_name       VARCHAR(200) NOT NULL,
    rut             VARCHAR(20),
    email           VARCHAR(150),
    phone           VARCHAR(50),
    position        VARCHAR(120),
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_persons_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,

    CONSTRAINT fk_persons_department
        FOREIGN KEY (department_id)   REFERENCES departments(id)   ON DELETE SET NULL
);

COMMENT ON TABLE  persons          IS 'Personas asociadas a la organización. Pueden ser titulares de datos o usuarios internos.';
COMMENT ON COLUMN persons.rut      IS 'RUT chileno. Identifica al titular ante el sistema.';
COMMENT ON COLUMN persons.position IS 'Cargo o rol de la persona dentro de la organización.';

-- ------------------------------------------------------------
-- TABLE: organization_settings
-- ------------------------------------------------------------

CREATE TABLE organization_settings (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id     UUID         NOT NULL UNIQUE,
    default_language    VARCHAR(20)  NOT NULL DEFAULT 'es',
    privacy_email       VARCHAR(150),
    allow_data_exports  BOOLEAN      NOT NULL DEFAULT TRUE,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_org_settings_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

COMMENT ON TABLE  organization_settings                    IS 'Configuración de privacidad y preferencias de cada organización.';
COMMENT ON COLUMN organization_settings.privacy_email      IS 'Email del DPO o encargado de privacidad para recibir solicitudes ARCO.';
COMMENT ON COLUMN organization_settings.allow_data_exports IS 'Habilita o deshabilita la portabilidad de datos para los titulares.';

-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------

CREATE INDEX idx_departments_organization_id ON departments(organization_id);
CREATE INDEX idx_persons_organization_id     ON persons(organization_id);
CREATE INDEX idx_persons_department_id       ON persons(department_id);
CREATE INDEX idx_persons_rut                 ON persons(rut);
CREATE INDEX idx_persons_email               ON persons(email);
