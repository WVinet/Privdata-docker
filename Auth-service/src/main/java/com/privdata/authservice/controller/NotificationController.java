package com.privdata.authservice.controller;

import com.privdata.authservice.dto.request.ArcoNotificationRequestDTO;
import com.privdata.authservice.service.EmailService;
import com.privdata.authservice.shared.ApiResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final EmailService emailService;

    @PostMapping("/arco-resolution")
    public ResponseEntity<ApiResponseDTO<Void>> sendArcoResolution(@RequestBody ArcoNotificationRequestDTO request) {
        emailService.sendArcoResolutionEmail(
                request.getEmail(),
                request.getRequestTypeLabel(),
                request.getStatusLabel(),
                request.getResolutionSummary(),
                request.getDenialLegalBasis()
        );

        return ResponseEntity.ok(new ApiResponseDTO<>(true, "Notificación enviada", null));
    }
}
