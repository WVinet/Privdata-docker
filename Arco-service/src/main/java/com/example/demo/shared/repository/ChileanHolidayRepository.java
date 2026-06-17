package com.example.demo.shared.repository;

import com.example.demo.shared.model.ChileanHoliday;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ChileanHolidayRepository extends JpaRepository<ChileanHoliday, UUID> {
    boolean existsByHolidayDate(LocalDate holidayDate);
    List<ChileanHoliday> findByHolidayDateBetween(LocalDate start, LocalDate end);
}
