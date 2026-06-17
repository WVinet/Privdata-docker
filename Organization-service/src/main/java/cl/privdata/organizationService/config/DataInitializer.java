package cl.privdata.organizationService.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final OrganizationProperties props;
    private final JdbcTemplate jdbcTemplate;

    // UUIDs fijos para personas de prueba (deben coincidir con Auth-service)
    private static final String ADMIN_PERSON_ID   = "b92587b7-8bdd-4851-c365-2df796e28873";
    private static final String TITULAR_PERSON_ID = "c83698c8-9cff-4862-b476-3ef907f29984";
    private static final String AGENCY_AUDITOR_PERSON_ID = "85795030-53f8-4575-9716-706a14bdc94c";

    @Override
    public void run(ApplicationArguments args) {
        seedOrganization();
        seedPersons();
    }

    private void seedOrganization() {
        jdbcTemplate.update("""
            INSERT INTO organizations
                (id, name, legal_name, rut, business_type, email, is_active, created_at, updated_at)
            VALUES
                (CAST(? AS uuid), ?, ?, ?, ?, ?, true, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING
            """,
            props.getId(),
            props.getName(),
            props.getLegalName(),
            props.getRut(),
            props.getBusinessType(),
            props.getEmail()
        );
    }

    private void seedPersons() {

        // Persona del admin
        jdbcTemplate.update("""
        INSERT INTO persons
        (
         id,
         organization_id,
         first_name,
         last_name,
         full_name,
         rut,
         email,
         is_active,
         blocked,
         anonymized,
         deletion_request,
         data_status,
         created_at,
         updated_at
        )
        VALUES
        (
         CAST(? AS uuid),
         CAST(? AS uuid),
         ?, ?, ?, ?, ?,
         true,
         false,
         false,
         false,
         'ACTIVE',
         NOW(),
         NOW()
        )
        ON CONFLICT (id) DO NOTHING
        """,
                ADMIN_PERSON_ID,
                props.getId(),
                "Admin",
                "PrivData",
                "Admin PrivData",
                "11.111.111-1",
                "admin@privdata.cl"
        );

        // Persona titular
        jdbcTemplate.update("""
        INSERT INTO persons
        (
         id,
         organization_id,
         first_name,
         last_name,
         full_name,
         rut,
         email,
         is_active,
         blocked,
         anonymized,
         deletion_request,
         data_status,
         created_at,
         updated_at
        )
        VALUES
        (
         CAST(? AS uuid),
         CAST(? AS uuid),
         ?, ?, ?, ?, ?,
         true,
         false,
         false,
         false,
         'ACTIVE',
         NOW(),
         NOW()
        )
        ON CONFLICT (id) DO NOTHING
        """,
                TITULAR_PERSON_ID,
                props.getId(),
                "Juan",
                "Pérez",
                "Juan Pérez",
                "12.345.678-9",
                "titular@privdata.cl"
        );

        // Persona del auditor de la Agencia (tercero simulado)
        jdbcTemplate.update("""
        INSERT INTO persons
        (
         id,
         organization_id,
         first_name,
         last_name,
         full_name,
         rut,
         email,
         is_active,
         blocked,
         anonymized,
         deletion_request,
         data_status,
         created_at,
         updated_at
        )
        VALUES
        (
         CAST(? AS uuid),
         CAST(? AS uuid),
         ?, ?, ?, ?, ?,
         true,
         false,
         false,
         false,
         'ACTIVE',
         NOW(),
         NOW()
        )
        ON CONFLICT (id) DO NOTHING
        """,
                AGENCY_AUDITOR_PERSON_ID,
                props.getId(),
                "Auditor",
                "Agencia",
                "Auditor Agencia",
                "13.579.246-8",
                "auditor@agencia.cl"
        );
    }
}
