package com.example.demo.config;

import com.example.demo.arco.common.model.ChileanHoliday;
import com.example.demo.arco.common.repository.ChileanHolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

// Seed de feriados chilenos requerido por DeadlineCalculatorService (Art. 11 Ley 21.719)
@Component
@Order(1)
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final ChileanHolidayRepository holidayRepository;

    @Override
    public void run(ApplicationArguments args) {
        seedHolidays2025();
        seedHolidays2026();
        seedHolidays2027();
    }

    private void seedHolidays2025() {
        // Variable: Viernes Santo y Sábado Santo (Easter 2025: April 20)
        seed(2025, 1, 1,   "Año Nuevo");
        seed(2025, 4, 18,  "Viernes Santo");
        seed(2025, 4, 19,  "Sábado Santo");
        seed(2025, 5, 1,   "Día del Trabajo");
        seed(2025, 5, 21,  "Día de las Glorias Navales");
        seed(2025, 6, 21,  "Día Nacional de los Pueblos Indígenas");
        seed(2025, 6, 29,  "San Pedro y San Pablo");
        seed(2025, 7, 16,  "Día de la Virgen del Carmen");
        seed(2025, 8, 15,  "Asunción de la Virgen");
        seed(2025, 9, 18,  "Primera Junta de Gobierno");
        seed(2025, 9, 19,  "Día de las Glorias del Ejército");
        seed(2025, 10, 12, "Día del Encuentro de Dos Mundos");
        // Oct 31 cae en viernes → se corre al lunes 27
        seed(2025, 10, 27, "Día de las Iglesias Evangélicas y Protestantes");
        seed(2025, 11, 1,  "Día de Todos los Santos");
        seed(2025, 12, 8,  "Inmaculada Concepción");
        seed(2025, 12, 25, "Navidad");
    }

    private void seedHolidays2026() {
        // Variable: Viernes Santo y Sábado Santo (Easter 2026: April 5)
        seed(2026, 1, 1,   "Año Nuevo");
        seed(2026, 4, 3,   "Viernes Santo");
        seed(2026, 4, 4,   "Sábado Santo");
        seed(2026, 5, 1,   "Día del Trabajo");
        seed(2026, 5, 21,  "Día de las Glorias Navales");
        seed(2026, 6, 21,  "Día Nacional de los Pueblos Indígenas");
        seed(2026, 6, 29,  "San Pedro y San Pablo");
        seed(2026, 7, 16,  "Día de la Virgen del Carmen");
        seed(2026, 8, 15,  "Asunción de la Virgen");
        seed(2026, 9, 18,  "Primera Junta de Gobierno");
        seed(2026, 9, 19,  "Día de las Glorias del Ejército");
        seed(2026, 10, 12, "Día del Encuentro de Dos Mundos");
        // Oct 31 cae en sábado → se corre al lunes 26
        seed(2026, 10, 26, "Día de las Iglesias Evangélicas y Protestantes");
        seed(2026, 11, 1,  "Día de Todos los Santos");
        seed(2026, 12, 8,  "Inmaculada Concepción");
        seed(2026, 12, 25, "Navidad");
    }

    private void seedHolidays2027() {
        // Variable: Viernes Santo y Sábado Santo (Easter 2027: March 28)
        seed(2027, 1, 1,   "Año Nuevo");
        seed(2027, 3, 26,  "Viernes Santo");
        seed(2027, 3, 27,  "Sábado Santo");
        seed(2027, 5, 1,   "Día del Trabajo");
        seed(2027, 5, 21,  "Día de las Glorias Navales");
        seed(2027, 6, 21,  "Día Nacional de los Pueblos Indígenas");
        seed(2027, 6, 29,  "San Pedro y San Pablo");
        seed(2027, 7, 16,  "Día de la Virgen del Carmen");
        seed(2027, 8, 15,  "Asunción de la Virgen");
        seed(2027, 9, 18,  "Primera Junta de Gobierno");
        seed(2027, 9, 19,  "Día de las Glorias del Ejército");
        seed(2027, 10, 12, "Día del Encuentro de Dos Mundos");
        seed(2027, 10, 31, "Día de las Iglesias Evangélicas y Protestantes");
        seed(2027, 11, 1,  "Día de Todos los Santos");
        seed(2027, 12, 8,  "Inmaculada Concepción");
        seed(2027, 12, 25, "Navidad");
    }

    private void seed(int year, int month, int day, String description) {
        LocalDate date = LocalDate.of(year, month, day);
        if (!holidayRepository.existsByHolidayDate(date)) {
            holidayRepository.save(new ChileanHoliday(null, date, description, year));
        }
    }
}
