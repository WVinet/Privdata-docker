package com.example.demo.arco.common.factory;

import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.model.ArcoRequest;

public abstract class ArcoRequestFactory {

    public final ArcoRequest crear(ArcoRequestCreateDTO dto) {
        validarContenidoMinimoArt11(dto);
        return crearSolicitudEspecifica(dto);
    }

    // Art. 11 Ley 21.719: contenido mínimo que toda solicitud debe registrar
    protected void validarContenidoMinimoArt11(ArcoRequestCreateDTO dto) {
        if (dto.getOrganizationId() == null) {
            throw new IllegalArgumentException("La solicitud debe indicar la organización (Art. 11 Ley 21.719).");
        }
        if (dto.getDataSubjectId() == null) {
            throw new IllegalArgumentException("La solicitud debe identificar al titular de los datos (Art. 11 Ley 21.719).");
        }
        if (dto.getDescription() == null || dto.getDescription().isBlank()) {
            throw new IllegalArgumentException("La solicitud debe incluir una descripción del contenido solicitado (Art. 11 Ley 21.719).");
        }
    }

    protected abstract ArcoRequest crearSolicitudEspecifica(ArcoRequestCreateDTO dto);

    public abstract ArcoRequestType getTipo();
}
