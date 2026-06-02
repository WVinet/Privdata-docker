package cl.privdata.complianceService.config;

import java.util.UUID;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import cl.privdata.complianceService.model.ConsentDefinition;
import cl.privdata.complianceService.model.enums.LegalBasis;
import cl.privdata.complianceService.repository.ConsentDefinitionRepository;

@Component
@Order(2)
public class ConsentDefinitionSeeder implements ApplicationRunner {

    private static final UUID ORG_ID = UUID.fromString("a81476a6-7acc-4740-b254-1ce685d17762");

    private final ConsentDefinitionRepository repository;

    public ConsentDefinitionSeeder(ConsentDefinitionRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed(
            "Tratamiento de datos de perfil personal",
            "Autorizo el tratamiento de mis datos de identificación (RUT) y contacto (teléfono) " +
            "para la gestión de mi perfil en el sistema, conforme al Art. 12 Ley 21.719.",
            true,
            LegalBasis.CONSENTIMIENTO
        );

        seed(
            "Política de privacidad y términos de uso",
            "He leído y acepto la política de privacidad y los términos de uso del sistema PrivData.",
            true,
            LegalBasis.CONSENTIMIENTO
        );

        seed(
            "Comunicaciones y notificaciones del sistema",
            "Autorizo el envío de notificaciones relacionadas con mis solicitudes ARCO y el estado de mis datos.",
            false,
            LegalBasis.CONSENTIMIENTO
        );
    }

    private void seed(String title, String description, boolean required, LegalBasis legalBasis) {
        if (repository.existsByTitleAndOrganizationId(title, ORG_ID)) return;

        ConsentDefinition def = new ConsentDefinition();
        def.setOrganizationId(ORG_ID);
        def.setTitle(title);
        def.setDescription(description);
        def.setRequired(required);
        def.setLegalBasis(legalBasis);
        def.setActive(true);
        repository.save(def);
    }
}
