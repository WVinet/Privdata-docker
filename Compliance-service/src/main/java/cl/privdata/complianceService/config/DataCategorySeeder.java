package cl.privdata.complianceService.config;

import cl.privdata.complianceService.model.DataCategory;
import cl.privdata.complianceService.repository.DataCategoryRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DataCategorySeeder implements ApplicationRunner {

    private final DataCategoryRepository repository;

    public DataCategorySeeder(DataCategoryRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed("Nombre completo",          "Nombre y apellidos de la persona",                        false);
        seed("RUT / Cédula de identidad","Número de identificación único",                          false);
        seed("Correo electrónico",       "Dirección de correo electrónico",                         false);
        seed("Teléfono",                 "Número de teléfono fijo o móvil",                         false);
        seed("Dirección",                "Domicilio postal o dirección física",                     false);
        seed("Fecha de nacimiento",      "Fecha de nacimiento del titular",                         false);
        seed("Datos laborales",          "Cargo, empresa, historial laboral",                       false);
        seed("Datos financieros",        "Cuentas bancarias, historial crediticio, ingresos",       false);
        seed("Datos de navegación",      "IP, cookies, comportamiento en plataformas digitales",    false);

        // Datos sensibles - Art. 2 g) Ley 21.719
        seed("Origen étnico o racial",         "Datos que revelan origen étnico o racial",                                  true);
        seed("Afiliación política",            "Afiliación a partidos u organizaciones políticas",                          true);
        seed("Afiliación sindical o gremial",  "Pertenencia a sindicatos u organizaciones gremiales",                       true);
        seed("Situación socioeconómica",        "Datos sobre nivel socioeconómico del titular",                              true);
        seed("Convicciones ideológicas",        "Convicciones filosóficas o ideológicas",                                    true);
        seed("Creencias religiosas",           "Creencias o prácticas religiosas",                                          true);
        seed("Datos de salud",                 "Información médica, diagnósticos, tratamientos - Art. 16 bis",              true);
        seed("Perfil biológico humano",        "Información genética o biológica - Art. 16 bis",                            true);
        seed("Datos biométricos",              "Huella digital, iris, rasgos faciales, voz - Art. 16 ter",                  true);
        seed("Datos de geolocalización",       "Ubicación física o movimientos del titular - Art. 16 sexies",               true);
        seed("Datos de menores de edad",       "Datos de niños (< 14 años) y adolescentes (14-18 años) - Art. 16 quáter",  true);
    }

    private void seed(String name, String description, boolean sensitive) {
        if (!repository.existsByName(name)) {
            DataCategory cat = new DataCategory();
            cat.setName(name);
            cat.setDescription(description);
            cat.setSensitive(sensitive);
            cat.setActive(true);
            repository.save(cat);
        }
    }
}
