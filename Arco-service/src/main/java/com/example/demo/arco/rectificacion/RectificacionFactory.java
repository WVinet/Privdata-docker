package com.example.demo.arco.rectificacion;

import com.example.demo.arco.common.factory.ArcoRequestFactory;
import com.example.demo.arco.rectificacion.service.RectificacionService;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.model.ArcoRequest;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RectificacionFactory extends ArcoRequestFactory {

    private final RectificacionService rectificacionService;
    private final ObjectMapper objectMapper;

    @Override
    public ArcoRequestType getTipo() {
        return ArcoRequestType.RECTIFICACION;
    }

    @Override
    protected ArcoRequest crearSolicitudEspecifica(ArcoRequestCreateDTO dto) {
        // Art. 7°: la solicitud de rectificación debe identificar el dato a corregir
        // y el valor propuesto
        JsonNode json;
        try {
            json = objectMapper.readTree(dto.getDescription());
        } catch (Exception e) {
            throw new IllegalArgumentException(
                "La descripción debe ser un JSON con los campos field, fieldLabel y proposedValue (Art. 7° Ley 21.719).");
        }

        if (json.path("field").asText("").isBlank()
                || json.path("fieldLabel").asText("").isBlank()
                || json.path("proposedValue").asText("").isBlank()) {
            throw new IllegalArgumentException(
                "La solicitud de rectificación debe indicar el campo (field), su etiqueta (fieldLabel) y el valor propuesto (proposedValue) (Art. 7° Ley 21.719).");
        }

        return rectificacionService.crear(dto);
    }
}
