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
        solicitudArco.setStatus(ArcoStatus.EN_GESTION);
        solicitudArco.setIdentityVerificationStatus(
                ArcoIdentityVerificationStatus.ACCESS_ACCEPTED);
        solicitudArco.setRequestChannel(request.getRequestChannel());
        solicitudArco.setSubmittedAt(LocalDateTime.now());
        solicitudArco.setDueDate(LocalDateTime.now().plusDays(15));
        solicitudArco.setDescription(request.getDescription());

        solicitudArco.setResolutionSummary("");
        solicitudArco.setResolvedAt(LocalDateTime.now().plusMonths(1));


        return arcoRequestRepository.save(solicitudArco);

    }
    


}
