package cl.privdata.complianceService.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Siembra datos de demostración: 2 actividades de tratamiento (RAT) y
 * 3 consentimientos para el titular de prueba, permitiendo simular el
 * flujo completo del derecho de acceso ARCO.
 *
 * Al avanzar a producción, reemplazar estos registros por datos reales
 * ingresados vía formulario de admin o portal titular.
 */
@Component
@Order(2)
public class DemoDataSeeder implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    // ── IDs fijos del sistema (deben coincidir con Auth-service y Org-service) ──
    private static final String ORG_ID     = "a81476a6-7acc-4740-b254-1ce685d17762";
    private static final String TITULAR_ID = "c83698c8-9cff-4862-b476-3ef907f29984";

    // ── IDs fijos para los RAT de demo ──────────────────────────────────────────
    private static final String RAT_CLIENTES_ID  = "d1a00001-0001-0001-0001-000000000001";
    private static final String RAT_MARKETING_ID = "d1a00002-0002-0002-0002-000000000002";

    // ── IDs fijos para los consentimientos de demo ───────────────────────────────
    private static final String CONSENT_CONTACTO_ID   = "c0000001-0001-0001-0001-000000000001";
    private static final String CONSENT_MARKETING_ID  = "c0000002-0002-0002-0002-000000000002";
    private static final String CONSENT_NAVEGACION_ID = "c0000003-0003-0003-0003-000000000003";

    // ── Placeholder purpose/policy (sin tabla de respaldo — sólo para hash) ─────
    private static final String PURPOSE_CONTACTO   = "f0000001-1111-1111-1111-000000000001";
    private static final String PURPOSE_MARKETING  = "f0000002-2222-2222-2222-000000000002";
    private static final String PURPOSE_NAVEGACION = "f0000003-3333-3333-3333-000000000003";
    private static final String POLICY_V1          = "b0000001-aaaa-aaaa-aaaa-000000000001";

    public DemoDataSeeder(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedRat();
        seedConsents();
    }

    // ── RAT ───────────────────────────────────────────────────────────────────────

    private void seedRat() {
        LocalDateTime now = LocalDateTime.now();

        // RAT 1 — Gestión de clientes y prestación del servicio
        insertRat(
            RAT_CLIENTES_ID,
            "Gestión de relación con clientes",
            "Tratamiento de datos personales para la prestación del servicio contratado, " +
            "gestión comercial y cumplimiento de obligaciones legales.",
            "Prestación del servicio, gestión comercial y cumplimiento legal",
            "CONTRATO",
            "Clientes y prospectos",
            1825,   // 5 años
            "Sin transferencia a terceros",
            false,
            "organization-service, auth-service",
            "Acceso restringido por rol, cifrado en tránsito (TLS), backups diarios",
            now
        );
        linkRatCategory(RAT_CLIENTES_ID, "Nombre completo");
        linkRatCategory(RAT_CLIENTES_ID, "RUT / Cédula de identidad");
        linkRatCategory(RAT_CLIENTES_ID, "Correo electrónico");
        linkRatCategory(RAT_CLIENTES_ID, "Teléfono");
        linkRatCategory(RAT_CLIENTES_ID, "Dirección");

        // RAT 2 — Marketing y comunicaciones
        insertRat(
            RAT_MARKETING_ID,
            "Marketing y comunicaciones personalizadas",
            "Tratamiento de datos para el envío de comunicaciones comerciales, " +
            "análisis de comportamiento y personalización de ofertas.",
            "Envío de comunicaciones comerciales y análisis de comportamiento",
            "CONSENTIMIENTO",
            "Clientes con consentimiento activo",
            365,    // 1 año
            "Proveedor de email marketing (país: Chile)",
            false,
            "compliance-service",
            "Cifrado en tránsito, anonimización para análisis agregados",
            now
        );
        linkRatCategory(RAT_MARKETING_ID, "Nombre completo");
        linkRatCategory(RAT_MARKETING_ID, "Correo electrónico");
        linkRatCategory(RAT_MARKETING_ID, "Datos de navegación");
    }

    private void insertRat(String id, String name, String description, String purpose,
                           String legalBasis, String dataSubjectCategories, int retentionDays,
                           String thirdParty, boolean intlTransfer, String dataSystems,
                           String securityMeasures, LocalDateTime now) {
        jdbc.update("""
            INSERT INTO treatment_activities
                (id, organization_id, name, description, purpose, legal_basis,
                 data_subject_categories, retention_period_days, third_party_recipients,
                 international_transfer, data_systems, security_measures,
                 status, created_at, updated_at)
            VALUES
                (CAST(? AS uuid), CAST(? AS uuid), ?, ?, ?, ?,
                 ?, ?, ?,
                 ?, ?, ?,
                 'ACTIVE', ?, ?)
            ON CONFLICT (id) DO NOTHING
            """,
            id, ORG_ID, name, description, purpose, legalBasis,
            dataSubjectCategories, retentionDays, thirdParty,
            intlTransfer, dataSystems, securityMeasures,
            now, now
        );
    }

    private void linkRatCategory(String ratId, String categoryName) {
        String catId = findCategoryId(categoryName);
        if (catId == null) return;
        jdbc.update("""
            INSERT INTO treatment_activity_data_categories
                (id, treatment_activity_id, data_category_id)
            VALUES (gen_random_uuid(), CAST(? AS uuid), CAST(? AS uuid))
            ON CONFLICT ON CONSTRAINT uk_rat_category DO NOTHING
            """,
            ratId, catId
        );
    }

    // ── Consentimientos ───────────────────────────────────────────────────────────

    private void seedConsents() {
        LocalDateTime now       = LocalDateTime.now();
        LocalDateTime oneYearAgo   = now.minusYears(1);
        LocalDateTime sixMonthsAgo = now.minusMonths(6);
        LocalDateTime threeMonthsAgo = now.minusMonths(3);

        // Consentimiento 1 — ACTIVO: datos de contacto (canal: EMAIL, hace 1 año)
        String textContacto = "He sido informado/a sobre el tratamiento de mis datos personales " +
            "(nombre, RUT, correo, teléfono y dirección) para la prestación del servicio contratado, " +
            "conforme a la Política de Privacidad versión 1.0 de PrivData. " +
            "Otorgo mi consentimiento de manera libre e informada.";
        insertConsent(
            CONSENT_CONTACTO_ID, TITULAR_ID, PURPOSE_CONTACTO, POLICY_V1,
            "ACTIVE", "EMAIL",
            oneYearAgo, null, null,
            textContacto,
            "demo-hash-contacto-" + TITULAR_ID,
            "Consentimiento para tratamiento de datos de contacto y prestación del servicio",
            now
        );
        linkConsentCategory(CONSENT_CONTACTO_ID, "Nombre completo");
        linkConsentCategory(CONSENT_CONTACTO_ID, "RUT / Cédula de identidad");
        linkConsentCategory(CONSENT_CONTACTO_ID, "Correo electrónico");
        linkConsentCategory(CONSENT_CONTACTO_ID, "Teléfono");
        insertConsentEvent(CONSENT_CONTACTO_ID, "GRANT", null, "ACTIVE", oneYearAgo,
            "EMAIL", textContacto, "demo-event-hash-contacto-grant");

        // Consentimiento 2 — ACTIVO: marketing (canal: WEB_PORTAL, hace 6 meses)
        LocalDateTime expiresMarketing = sixMonthsAgo.plusYears(1);
        String textMarketing = "Autorizo el envío de comunicaciones comerciales, ofertas personalizadas " +
            "y el análisis de mi comportamiento en plataformas digitales, conforme a la Política de " +
            "Privacidad v1.0. Entiendo que puedo revocar este consentimiento en cualquier momento.";
        insertConsent(
            CONSENT_MARKETING_ID, TITULAR_ID, PURPOSE_MARKETING, POLICY_V1,
            "ACTIVE", "WEB_PORTAL",
            sixMonthsAgo, null, expiresMarketing,
            textMarketing,
            "demo-hash-marketing-" + TITULAR_ID,
            "Consentimiento para comunicaciones de marketing y ofertas personalizadas",
            now
        );
        linkConsentCategory(CONSENT_MARKETING_ID, "Correo electrónico");
        linkConsentCategory(CONSENT_MARKETING_ID, "Datos de navegación");
        insertConsentEvent(CONSENT_MARKETING_ID, "GRANT", null, "ACTIVE", sixMonthsAgo,
            "WEB_PORTAL", textMarketing, "demo-event-hash-marketing-grant");

        // Consentimiento 3 — REVOCADO: navegación (canal: WEB_PORTAL, otorgado hace 1 año, revocado hace 3 meses)
        String textNavegacion = "Autorizo el análisis detallado de mi comportamiento de navegación " +
            "para mejora de la experiencia de usuario.";
        insertConsent(
            CONSENT_NAVEGACION_ID, TITULAR_ID, PURPOSE_NAVEGACION, POLICY_V1,
            "REVOKED", "WEB_PORTAL",
            oneYearAgo, threeMonthsAgo, null,
            textNavegacion,
            "demo-hash-navegacion-" + TITULAR_ID,
            "Análisis de comportamiento de navegación — revocado por el titular",
            now
        );
        linkConsentCategory(CONSENT_NAVEGACION_ID, "Datos de navegación");
        insertConsentEvent(CONSENT_NAVEGACION_ID, "GRANT", null, "ACTIVE", oneYearAgo,
            "WEB_PORTAL", textNavegacion, "demo-event-hash-navegacion-grant");
        insertConsentEvent(CONSENT_NAVEGACION_ID, "REVOKE", "ACTIVE", "REVOKED", threeMonthsAgo,
            "WEB_PORTAL", null, "demo-event-hash-navegacion-revoke");
    }

    private void insertConsent(String id, String dataSubjectId, String purposeId, String policyVersionId,
                               String status, String collectionMethod,
                               LocalDateTime grantedAt, LocalDateTime revokedAt, LocalDateTime expiresAt,
                               String textSnapshot, String evidenceHash, String notes,
                               LocalDateTime now) {
        jdbc.update("""
            INSERT INTO consents
                (id, organization_id, data_subject_id, purpose_id, policy_version_id,
                 status, granted_at, revoked_at, expires_at,
                 collection_method, evidence_hash, evidence_url, notes,
                 created_at, updated_at)
            VALUES
                (CAST(? AS uuid), CAST(? AS uuid), CAST(? AS uuid), CAST(? AS uuid), CAST(? AS uuid),
                 ?, ?, ?, ?,
                 ?, ?, null, ?,
                 ?, ?)
            ON CONFLICT (id) DO NOTHING
            """,
            id, ORG_ID, dataSubjectId, purposeId, policyVersionId,
            status, grantedAt, revokedAt, expiresAt,
            collectionMethod, evidenceHash, notes,
            now, now
        );
    }

    private void linkConsentCategory(String consentId, String categoryName) {
        String catId = findCategoryId(categoryName);
        if (catId == null) return;
        jdbc.update("""
            INSERT INTO consent_data_categories
                (id, consent_id, personal_data_category_id)
            VALUES (gen_random_uuid(), CAST(? AS uuid), CAST(? AS uuid))
            ON CONFLICT ON CONSTRAINT uk_consent_category DO NOTHING
            """,
            consentId, catId
        );
    }

    private void insertConsentEvent(String consentId, String eventType,
                                    String previousStatus, String newStatus,
                                    LocalDateTime timestamp, String channel,
                                    String textSnapshot, String evidenceHash) {
        jdbc.update("""
            INSERT INTO consent_events
                (id, consent_id, event_type, previous_status, new_status,
                 event_timestamp, channel, text_snapshot, evidence_hash,
                 details_json)
            VALUES
                (gen_random_uuid(), CAST(? AS uuid), ?, ?, ?,
                 ?, ?, ?, ?,
                 '{}')
            ON CONFLICT DO NOTHING
            """,
            consentId, eventType, previousStatus, newStatus,
            timestamp, channel, textSnapshot, evidenceHash
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────────

    private String findCategoryId(String name) {
        var results = jdbc.queryForList(
            "SELECT id FROM data_categories WHERE name = ?", String.class, name
        );
        return results.isEmpty() ? null : results.get(0);
    }
}
