package com.example.demo.arco.bloqueo;

import com.example.demo.arco.common.factory.ArcoRequestFactory;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.model.ArcoRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BloqueoTemporalFactory extends ArcoRequestFactory {

    private final BloqueoTemporalService bloqueoTemporalService;

    @Override
    public ArcoRequestType getTipo() {
        return ArcoRequestType.BLOQUEO_TEMPORAL;
    }

    @Override
    protected ArcoRequest crearSolicitudEspecifica(ArcoRequestCreateDTO dto) {
        return bloqueoTemporalService.crear(dto);
    }
}
