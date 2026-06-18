package com.example.demo.arsop.solicitudesAdicionales.anonimizacion;

import com.example.demo.arsop.common.factory.ArcoRequestFactory;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.model.ArcoRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AnonimizacionFactory extends ArcoRequestFactory {

    private final AnonimizacionService anonimizacionService;

    @Override
    public ArcoRequestType getTipo() {
        return ArcoRequestType.ANONIMIZACION;
    }

    @Override
    protected ArcoRequest crearSolicitudEspecifica(ArcoRequestCreateDTO dto) {
        return anonimizacionService.crear(dto);
    }
}
