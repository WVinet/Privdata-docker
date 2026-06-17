package com.example.demo.arco.acceso;

import com.example.demo.arco.common.factory.ArcoRequestFactory;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.model.ArcoRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AccesoFactory extends ArcoRequestFactory {

    private final AccesoService accesoService;

    @Override
    public ArcoRequestType getTipo() {
        return ArcoRequestType.ACCESO;
    }

    @Override
    protected ArcoRequest crearSolicitudEspecifica(ArcoRequestCreateDTO dto) {
        return accesoService.crear(dto);
    }
}
