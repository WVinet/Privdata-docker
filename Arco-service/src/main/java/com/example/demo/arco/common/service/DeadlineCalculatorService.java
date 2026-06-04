package com.example.demo.arco.common.service;

import com.example.demo.arco.common.model.ChileanHoliday;
import com.example.demo.arco.common.repository.ChileanHolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeadlineCalculatorService {

    private final ChileanHolidayRepository holidayRepository;

    // Art. 11 Ley 21.719: plazo general de respuesta — días CORRIDOS (calendario)
    // Usos: opposition_request.due_date (+30), extension_date (+30)
    public LocalDateTime addCalendarDays(LocalDateTime from, int days) {
        return from.plusDays(days);
    }

    // Art. 11 Ley 21.719: plazos especiales — días HÁBILES (excluye sáb, dom y feriados chilenos)
    // Usos: temporary_block.due_date (+2), agency_claim.agency_claim_deadline (+30)
    public LocalDateTime addBusinessDays(LocalDateTime from, int days) {
        LocalDate startDate = from.toLocalDate();
        // Estimación conservadora del rango a consultar (días hábiles × 2 para cubrir fines de semana y feriados)
        LocalDate endDate = startDate.plusDays((long) days * 3);
        Set<LocalDate> holidays = loadHolidaysForRange(startDate, endDate);

        LocalDateTime result = from;
        int added = 0;
        while (added < days) {
            result = result.plusDays(1);
            if (isBusinessDay(result.toLocalDate(), holidays)) {
                added++;
            }
        }
        return result;
    }

    private boolean isBusinessDay(LocalDate date, Set<LocalDate> holidays) {
        DayOfWeek day = date.getDayOfWeek();
        return day != DayOfWeek.SATURDAY
            && day != DayOfWeek.SUNDAY
            && !holidays.contains(date);
    }

    private Set<LocalDate> loadHolidaysForRange(LocalDate from, LocalDate to) {
        return holidayRepository.findByHolidayDateBetween(from, to)
                .stream()
                .map(ChileanHoliday::getHolidayDate)
                .collect(Collectors.toSet());
    }
}
