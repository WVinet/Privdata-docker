package com.example.demo.arco.supresion;

import com.example.demo.arco.common.factory.ArcoRequestFactory;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.model.ArcoRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SupresionFactory extends ArcoRequestFactory {

    private final SupresionService supresionService;

    @Override
    public ArcoRequestType getTipo() {
        return ArcoRequestType.CANCELLATION;
    }

    @Override
    protected ArcoRequest crearSolicitudEspecifica(ArcoRequestCreateDTO dto) {
        return supresionService.crear(dto);
    }
}
