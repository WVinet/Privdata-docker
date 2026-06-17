package com.example.demo.config;

import com.example.demo.enums.arcoRequest.*;
import com.example.demo.model.ArcoRequest;
import com.example.demo.repository.ArcoRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ArcoDataInitializer implements CommandLineRunner {

    private final ArcoRequestRepository arcoRequestRepository;

    @Override
    public void run(String... args) {

        UUID organizationId = UUID.fromString("a81476a6-7acc-4740-b254-1ce685d17762");
        UUID dataSubjectId = UUID.fromString("c83698c8-9cff-4862-b476-3ef907f29984");

        if (!arcoRequestRepository.findByOrganizationId(organizationId).isEmpty()) {
            return;
        }

        ArcoRequest request = new ArcoRequest();
        request.setOrganizationId(organizationId);
        request.setDataSubjectId(dataSubjectId);
        request.setAssignedToUserId(null);
        request.setRequestType(ArcoRequestType.SUPRESION);
        request.setCancellationActionType(ArcoCancellationType.BLOCK);
        request.setRequestChannel(ArcoRequestChannel.WEB_PORTAL);
        request.setStatus(ArcoStatus.RECIBIDA);
        request.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.PENDIENTE);
        request.setSubmittedAt(LocalDateTime.now());
        request.setDueDate(LocalDateTime.now().plusDays(2));
        request.setDescription("Solicitud de prueba para cancelación por bloqueo lógico.");
        request.setResolutionSummary(null);
        request.setResolvedAt(null);

        arcoRequestRepository.save(request);
    }
}
