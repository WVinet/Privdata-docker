package com.example.demo.arco.portabilidad;

import com.example.demo.arco.common.factory.ArcoRequestFactory;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.model.ArcoRequest;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PortabilidadFactory extends ArcoRequestFactory {

    private static final List<String> FORMATOS_VALIDOS = List.of("JSON", "CSV", "XML");

    private final PortabilidadService portabilidadService;
    private final ObjectMapper objectMapper;

    @Override
    public ArcoRequestType getTipo() {
        return ArcoRequestType.PORTABILIDAD;
    }

    @Override
    protected ArcoRequest crearSolicitudEspecifica(ArcoRequestCreateDTO dto) {
        // Art. 9°: si se indica un formato de exportación, debe ser uno soportado
        try {
            JsonNode json = objectMapper.readTree(dto.getDescription());
            String exportFormat = json.path("exportFormat").asText(null);
            if (exportFormat != null && !FORMATOS_VALIDOS.contains(exportFormat.toUpperCase())) {
                throw new IllegalArgumentException(
                    "El formato de exportación debe ser JSON, CSV o XML (Art. 9° Ley 21.719).");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception ignored) {
            // description en texto libre — se acepta igual
        }
        return portabilidadService.crear(dto);
    }
}
