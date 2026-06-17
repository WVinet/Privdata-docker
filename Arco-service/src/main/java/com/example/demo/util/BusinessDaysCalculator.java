package com.example.demo.util;

import com.example.demo.enums.arcoRequest.ArcoRequestType;

import java.time.DayOfWeek;
import java.time.LocalDateTime;

public class BusinessDaysCalculator {

    private BusinessDaysCalculator() {}

    public static LocalDateTime calcularFechaLimite(
            LocalDateTime inicio,
            ArcoRequestType tipo
    ) {

        switch (tipo) {

            case SUPRESION:
            case BLOQUEO_TEMPORAL:
                return agregarDiasHabiles(inicio, 2);

            case ACCESO:
            case RECTIFICACION:
            case OPOSICION:
            case PORTABILIDAD:
            case ANONIMIZACION:
            default:
                return inicio.plusDays(30);
        }
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
