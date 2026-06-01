package com.example.demo.service;

import com.example.demo.exception.ArcoRequestNotFoundException;
import com.example.demo.model.ArcoRequestStatusHistory;
import com.example.demo.repository.ArcoRequestRepository;
import com.example.demo.repository.ArcoRequestStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ArcoRequestStatusHistoryService {

    private final ArcoRequestStatusHistoryRepository statusHistoryRepository;
    private final ArcoRequestRepository arcoRequestRepository;

    public List<ArcoRequestStatusHistory> historialPorSolicitud(UUID arcoRequestId) {
        if (!arcoRequestRepository.existsById(arcoRequestId)) {
            throw new ArcoRequestNotFoundException(arcoRequestId);
        }
        return statusHistoryRepository.findByArcoRequest_IdOrderByChangedAtAsc(arcoRequestId);
    }
}
