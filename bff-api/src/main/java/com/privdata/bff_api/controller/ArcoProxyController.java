package com.privdata.bff_api.controller;

import com.privdata.bff_api.client.ArcoClient;
import com.privdata.bff_api.dtos.request.arco.ArcoCancellationRequestDTO;
import com.privdata.bff_api.dtos.response.arco.ArcoRequestResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/arco")
@RequiredArgsConstructor
public class ArcoProxyController {

    private final ArcoClient arcoClient;

    @PostMapping("/cancellation")
    public ResponseEntity<ArcoRequestResponseDTO> crearCancelacion(
            @RequestBody ArcoCancellationRequestDTO request
    ) {
        return ResponseEntity.ok(
                arcoClient.crearSolicitudCancelacion(request)
        );
    }

    @PostMapping("/cancellation/{solicitudId}/execute")
    public ResponseEntity<ArcoRequestResponseDTO> ejecutarCancelacion(
            @PathVariable UUID solicitudId
    ) {
        return ResponseEntity.ok(
                arcoClient.ejecutarCancelacion(solicitudId)
        );
    }

    @PatchMapping("/{id}/verificacion-identidad")
    public ResponseEntity<ArcoRequestResponseDTO>actualizarVerificacionIdentidad(@PathVariable UUID id, @RequestParam String nuevoEstado){
        return ResponseEntity.ok(arcoClient.actualizarVerificacionIdentidad(id,nuevoEstado));
        }
}
