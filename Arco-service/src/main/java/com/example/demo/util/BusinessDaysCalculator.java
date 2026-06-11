package com.example.demo.util;

import com.example.demo.enums.arcoRequest.ArcoRequestType;

import java.time.DayOfWeek;
import java.time.LocalDateTime;

public class BusinessDaysCalculator {

    private BusinessDaysCalculator() {}

    public static LocalDateTime calcularFechaLimite(LocalDateTime inicio, ArcoRequestType tipo) {
        if (tipo == ArcoRequestType.BLOQUEO_TEMPORAL) {
            return agregarDiasHabiles(inicio, 2);
        }
        // Art. 11 Ley 21.719: 30 días corridos desde la presentación de la solicitud
        return inicio.plusDays(30);
    }

    private static LocalDateTime agregarDiasHabiles(LocalDateTime fecha, int dias) {
        LocalDateTime resultado = fecha;
        int agregados = 0;
        while (agregados < dias) {
            resultado = resultado.plusDays(1);
            DayOfWeek dia = resultado.getDayOfWeek();
            if (dia != DayOfWeek.SATURDAY && dia != DayOfWeek.SUNDAY) {
                agregados++;
            }
        }
        return resultado;
    }
}
