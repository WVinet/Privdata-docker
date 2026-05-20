-- ============================================================
-- PRIVDATA — complianceService
-- BASE DE DATOS: compliance_db
-- PostgreSQL 16 · Generado desde modelos JPA
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- LIMPIEZA
-- ------------------------------------------------------------

DROP TABLE IF EXISTS consent_data_categories CASCADE;
DROP TABLE IF EXISTS consent_events          CASCADE;
DROP TABLE IF EXISTS consents                CASCADE;

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consent_status') THEN
        CREATE TYPE consent_status AS ENUM ('ACTIVE','REVOKED','EXPIRED','SUSPENDED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consent_event_type') THEN
        CREATE TYPE consent_event_type AS ENUM ('GRANT','REVOKE','UPDATE_CATEGORIES');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collection_method') THEN
        CREATE TYPE collection_method AS ENUM ('WEB_PORTAL','ADMIN_PANEL','EMAIL','PHONE','IN_PERSON');
    END IF;
END $$;

-- ------------------------------------------------------------
-- TABLE: consents
-- ------------------------------------------------------------

CREATE TABLE consents (
    id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id   UUID              NOT NULL,
    data_subject_id   UUID              NOT NULL,
    purpose_id        UUID              NOT NULL,
    policy_version_id UUID              NOT NULL,
    status            consent_status    NOT NULL,
    granted_at        TIMESTAMPTZ,
    revoked_at        TIMESTAMPTZ,
    expires_at        TIMESTAMPTZ,
    collection_method collection_method NOT NULL,
    evidence_hash     CHAR(64)          NOT NULL,
    evidence_url      TEXT,
    notes             TEXT,
    created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  consents                   IS 'Consentimientos otorgados por titulares. Registro principal del ciclo de vida.';
COMMENT ON COLUMN consents.data_subject_id   IS 'UUID del titular (persons.id en organizationService). Sin FK cross-service intencional.';
COMMENT ON COLUMN consents.purpose_id        IS 'Finalidad del tratamiento. Referencia a futuro módulo de finalidades.';
COMMENT ON COLUMN consents.policy_version_id IS 'Versión de política de privacidad vigente al momento del consentimiento.';
COMMENT ON COLUMN consents.evidence_hash     IS 'SHA-256 calculado sobre los campos clave. Garantiza integridad auditable (Art. 14 Ley 21.719).';

-- ------------------------------------------------------------
-- TABLE: consent_events  (append-only)
-- ------------------------------------------------------------

CREATE TABLE consent_events (
    id                   UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id           UUID               NOT NULL,
    event_type           consent_event_type NOT NULL,
    previous_status      consent_status,
    new_status           consent_status     NOT NULL,
    event_timestamp      TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    performed_by_user_id UUID,
    channel              VARCHAR(50),
    ip_address           VARCHAR(100),
    user_agent           TEXT,
    text_snapshot        TEXT,
    evidence_hash        CHAR(64)           NOT NULL,
    evidence_url         TEXT,
    details_json         TEXT,

    CONSTRAINT fk_consent_events_consent
        FOREIGN KEY (consent_id) REFERENCES consents(id) ON DELETE CASCADE
);

COMMENT ON TABLE  consent_events                IS 'Log inmutable de cada transición de estado. Trazabilidad exigida por Ley 21.719.';
COMMENT ON COLUMN consent_events.previous_status IS 'NULL en el primer GRANT.';
COMMENT ON COLUMN consent_events.text_snapshot   IS 'Texto exacto de la cláusula mostrada al titular en este evento.';
COMMENT ON COLUMN consent_events.evidence_hash   IS 'SHA-256 sobre consent_id + event_type + timestamp. Detecta alteraciones.';

-- ------------------------------------------------------------
-- TABLE: consent_data_categories
-- ------------------------------------------------------------

CREATE TABLE consent_data_categories (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id                UUID NOT NULL,
    personal_data_category_id UUID NOT NULL,

    CONSTRAINT fk_cdc_consent
        FOREIGN KEY (consent_id) REFERENCES consents(id) ON DELETE CASCADE,

    CONSTRAINT uk_consent_category
        UNIQUE (consent_id, personal_data_category_id)
);

COMMENT ON TABLE  consent_data_categories                       IS 'Categorías de datos personales cubiertas por un consentimiento (N:M).';
COMMENT ON COLUMN consent_data_categories.personal_data_category_id IS 'UUID de la categoría (ej: salud, financiero). Referencia a futuro módulo de categorías.';

-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------

CREATE INDEX idx_consents_organization_id  ON consents(organization_id);
CREATE INDEX idx_consents_data_subject_id  ON consents(data_subject_id);
CREATE INDEX idx_consents_status           ON consents(status);
CREATE INDEX idx_consents_expires_at       ON consents(expires_at);

CREATE INDEX idx_consent_events_consent_id ON consent_events(consent_id);
CREATE INDEX idx_consent_events_timestamp  ON consent_events(event_timestamp DESC);
CREATE INDEX idx_consent_events_type       ON consent_events(event_type);

CREATE INDEX idx_cdc_consent_id            ON consent_data_categories(consent_id);
