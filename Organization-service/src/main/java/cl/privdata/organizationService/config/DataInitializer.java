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

    // UUIDs fijos para departamentos seedeados
    private static final String DEPT_CUMPLIMIENTO_ID = "e1d00001-0001-0001-0001-000000000001";
    private static final String DEPT_TECNOLOGIA_ID    = "e1d00002-0002-0002-0002-000000000002";
    private static final String DEPT_LEGAL_ID         = "e1d00003-0003-0003-0003-000000000003";
    private static final String DEPT_COMERCIAL_ID     = "e1d00004-0004-0004-0004-000000000004";
    private static final String DEPT_ADMINISTRACION_ID = "e1d00005-0005-0005-0005-000000000005";

    // UUIDs fijos para cargos seedeados
    private static final String CARGO_DPO_ID            = "f1c00001-0001-0001-0001-000000000001";
    private static final String CARGO_ANALISTA_CUMP_ID  = "f1c00002-0002-0002-0002-000000000002";
    private static final String CARGO_DESARROLLADOR_ID  = "f1c00003-0003-0003-0003-000000000003";
    private static final String CARGO_ABOGADO_ID        = "f1c00004-0004-0004-0004-000000000004";
    private static final String CARGO_EJECUTIVO_ID      = "f1c00005-0005-0005-0005-000000000005";
    private static final String CARGO_ANALISTA_SEG_ID   = "f1c00006-0006-0006-0006-000000000006";
    private static final String CARGO_GERENTE_OPS_ID    = "f1c00007-0007-0007-0007-000000000007";

    @Override
    public void run(ApplicationArguments args) {
        seedOrganization();
        seedPersons();
        seedDepartments();
        seedJobPositions();
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

    private void seedDepartments() {
        insertDepartment(DEPT_CUMPLIMIENTO_ID, "Cumplimiento y Protección de Datos",
                "Responsable de la gobernanza de privacidad, gestión de solicitudes ARSOP y cumplimiento de la Ley 21.719");
        insertDepartment(DEPT_TECNOLOGIA_ID, "Tecnología y Desarrollo",
                "Diseño, desarrollo y mantenimiento de los sistemas que procesan datos personales");
        insertDepartment(DEPT_LEGAL_ID, "Legal",
                "Asesoría jurídica en materia de protección de datos y contratos con terceros");
        insertDepartment(DEPT_COMERCIAL_ID, "Comercial y Atención al Cliente",
                "Gestión de la relación con clientes y titulares de datos");
        insertDepartment(DEPT_ADMINISTRACION_ID, "Administración y Finanzas",
                "Gestión de personas, contabilidad y procesos administrativos internos");
    }

    private void insertDepartment(String id, String name, String description) {
        jdbcTemplate.update("""
            INSERT INTO departments
                (id, organization_id, name, description, is_active, created_at)
            VALUES
                (CAST(? AS uuid), CAST(? AS uuid), ?, ?, true, NOW())
            ON CONFLICT (id) DO NOTHING
            """,
            id,
            props.getId(),
            name,
            description
        );
    }

    private void seedJobPositions() {
        insertJobPosition(CARGO_DPO_ID, "Oficial de Protección de Datos (DPO)",
                "Supervisa el cumplimiento de la Ley 21.719 y actúa como contraparte ante la Agencia de Protección de Datos");
        insertJobPosition(CARGO_ANALISTA_CUMP_ID, "Analista de Cumplimiento Normativo",
                "Gestiona el RAT, solicitudes ARSOP y evaluaciones de impacto de privacidad");
        insertJobPosition(CARGO_DESARROLLADOR_ID, "Desarrollador/a de Software",
                "Construye y mantiene los sistemas que tratan datos personales aplicando privacidad desde el diseño");
        insertJobPosition(CARGO_ABOGADO_ID, "Abogado/a de Privacidad",
                "Brinda asesoría legal sobre bases de licitud, contratos y respuestas a solicitudes de titulares");
        insertJobPosition(CARGO_EJECUTIVO_ID, "Ejecutivo/a de Atención al Cliente",
                "Punto de contacto con titulares de datos para consultas y solicitudes ARSOP");
        insertJobPosition(CARGO_ANALISTA_SEG_ID, "Analista de Seguridad de la Información",
                "Implementa medidas de seguridad técnicas para proteger los datos personales tratados");
        insertJobPosition(CARGO_GERENTE_OPS_ID, "Gerente de Operaciones",
                "Supervisa los procesos operativos de la organización y su impacto en el tratamiento de datos");
    }

    private void insertJobPosition(String id, String name, String description) {
        jdbcTemplate.update("""
            INSERT INTO job_positions
                (id, organization_id, name, description, is_active, created_at)
            VALUES
                (CAST(? AS uuid), CAST(? AS uuid), ?, ?, true, NOW())
            ON CONFLICT (id) DO NOTHING
            """,
            id,
            props.getId(),
            name,
            description
        );
    }
}
