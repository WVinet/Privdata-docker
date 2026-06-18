package com.example.demo.arsop.solicitudesAdicionales.anonimizacion.repository;

import com.example.demo.arsop.solicitudesAdicionales.anonimizacion.model.AnonymizationRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AnonymizationRequestRepository
        extends JpaRepository<AnonymizationRequest, UUID> {

    Optional<AnonymizationRequest> findByArcoRequest_Id(UUID requestId);
}