package com.example.demo.arco.oposicion;

import com.example.demo.arco.common.factory.ArcoRequestFactory;
import com.example.demo.arco.oposicion.enums.OppositionCausal;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.model.ArcoRequest;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OposicionFactory extends ArcoRequestFactory {

    private final OposicionService oposicionService;
    private final ObjectMapper objectMapper;

    @Override
    public ArcoRequestType getTipo() {
        return ArcoRequestType.OPOSICION;
    }

    @Override
    protected ArcoRequest crearSolicitudEspecifica(ArcoRequestCreateDTO dto) {
        try {
            JsonNode json = objectMapper.readTree(dto.getDescription());
            String causalStr = json.path("causal").asText(null);
            if (causalStr != null) {
                OppositionCausal causal = OppositionCausal.valueOf(causalStr);
                if (causal == OppositionCausal.INTERES_LEGITIMO
                        && json.path("justification").asText("").isBlank()
                        && json.path("reason").asText("").isBlank()) {
                    throw new IllegalArgumentException(
                        "La oposición por interés legítimo debe incluir una justificación (Art. 8° letra a Ley 21.719).");
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception ignored) {
            // description en texto libre — se acepta igual
        }
        return oposicionService.crear(dto);
    }
}
