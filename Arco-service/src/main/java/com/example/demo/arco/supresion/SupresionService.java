package com.example.demo.arco.supresion;

import com.example.demo.client.OrganizationClient;
import com.example.demo.dto.request.arcoRequest.ArcoRequestCreateDTO;
import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.model.ArcoRequest;
import com.example.demo.repository.ArcoRequestRepository;
import com.example.demo.util.BusinessDaysCalculator;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SupresionService {

    private final ArcoRequestRepository arcoRequestRepository;
    private final OrganizationClient organizationClient;

    @Transactional
    public ArcoRequest crear(ArcoRequestCreateDTO dto) {
        ArcoRequest solicitud = new ArcoRequest();
        solicitud.setOrganizationId(dto.getOrganizationId());
        solicitud.setDataSubjectId(dto.getDataSubjectId());
        solicitud.setAssignedToUserId(dto.getAssignedToUserId());
        solicitud.setRequestType(dto.getRequestType());
        solicitud.setRequestChannel(dto.getRequestChannel());
        solicitud.setDescription(dto.getDescription());
        solicitud.setStatus(ArcoStatus.RECIBIDA);
        solicitud.setIdentityVerificationStatus(ArcoIdentityVerificationStatus.PENDIENTE);
        LocalDateTime now = LocalDateTime.now();
        solicitud.setSubmittedAt(now);
        solicitud.setDueDate(BusinessDaysCalculator.calcularFechaLimite(now, dto.getRequestType()));

        // Art. 8° ter: bloqueo inmediato de los datos del titular desde la recepción
        try {
            organizationClient.blockDataSubject(dto.getOrganizationId(), dto.getDataSubjectId());
        } catch (Exception ex) {
            System.out.println("Bloqueo inmediato no pudo ejecutarse: " + ex.getMessage());
        }

        return arcoRequestRepository.save(solicitud);
    }
}
