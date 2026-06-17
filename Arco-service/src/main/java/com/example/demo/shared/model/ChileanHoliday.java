package com.example.demo.shared.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "chilean_holiday",
       uniqueConstraints = @UniqueConstraint(columnNames = "holiday_date"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChileanHoliday {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "holiday_date", nullable = false, unique = true)
    private LocalDate holidayDate;

    @Column(name = "description")
    private String description;

    @Column(name = "year", nullable = false)
    private int year;
}
