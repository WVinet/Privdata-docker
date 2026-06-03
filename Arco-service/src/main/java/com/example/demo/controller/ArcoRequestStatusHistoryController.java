package com.example.demo.controller;

import com.example.demo.dto.request.arcoRequestStatusHistory.ArcoRequestStatusHistoryResponseDTO;
import com.example.demo.service.ArcoRequestStatusHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/arco-request/{arcoRequestId}/historial")
@RequiredArgsConstructor
public class ArcoRequestStatusHistoryController {

    private final ArcoRequestStatusHistoryService statusHistoryService;

    @GetMapping
    public ResponseEntity<List<ArcoRequestStatusHistoryResponseDTO>> historial(@PathVariable UUID arcoRequestId) {
        return ResponseEntity.ok(statusHistoryService.historialPorSolicitud(arcoRequestId));
    }
}
