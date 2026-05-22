package com.example.demo.controller;

import com.example.demo.dto.arcoRequestAction.ArcoRequestActionCreateDTO;
import com.example.demo.model.ArcoRequestActions;
import com.example.demo.service.ArcoRequestActionsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/arco-request/{arcoRequestId}/acciones")
@RequiredArgsConstructor
public class ArcoRequestActionsController {

    private final ArcoRequestActionsService actionsService;

    @GetMapping
    public ResponseEntity<List<ArcoRequestActions>> listar(@PathVariable UUID arcoRequestId) {
        return ResponseEntity.ok(actionsService.listarPorSolicitud(arcoRequestId));
    }

    @PostMapping
    public ResponseEntity<ArcoRequestActions> registrar(
            @PathVariable UUID arcoRequestId,
            @Valid @RequestBody ArcoRequestActionCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(actionsService.registrarAccion(arcoRequestId, dto));
    }
}
