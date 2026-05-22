package com.example.demo.service;

import com.example.demo.enums.arcoRequest.ArcoIdentityVerificationStatus;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.model.ArcoRequest;
import org.springframework.stereotype.Service;

import com.example.demo.repository.ArcoRequestRepository;

import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ArcoRequestService {
    private final ArcoRequestRepository arcoRequestRepository;

    public List<ArcoRequest> findAll(){
        return arcoRequestRepository.findAll();
    }

    public ArcoRequest registrarSolicitud(ArcoRequest request){
        ArcoRequest solicitudArco = new ArcoRequest();

        solicitudArco.setOrganizationId(request.getOrganizationId());
        solicitudArco.setDataSubjectId(request.getDataSubjectId());
        solicitudArco.setAssignedToUserId(request.getAssignedToUserId());
        solicitudArco.setRequestType(request.getRequestType());
        solicitudArco.setStatus(ArcoStatus.RECIBIDA);
        solicitudArco.setIdentityVerificationStatus(
                ArcoIdentityVerificationStatus.ACCESS_ACCEPTED);
        solicitudArco.setRequestChannel(request.getRequestChannel());
        LocalDateTime now = LocalDateTime.now();
        solicitudArco.setSubmittedAt(now);
        solicitudArco.setDueDate(now.plusDays(30)); // Art. 11 Ley 21.719: 30 días corridos
        solicitudArco.setDescription(request.getDescription());

        solicitudArco.setResolutionSummary(null);
        solicitudArco.setResolvedAt(null);


        return arcoRequestRepository.save(solicitudArco);

    }
    


}
