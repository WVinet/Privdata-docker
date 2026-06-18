package com.example.demo.arco.portabilidad.repository;

import com.example.demo.arco.portabilidad.model.PortabilityRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PortabilityRequestRepository
        extends JpaRepository<PortabilityRequest, UUID> {

    Optional<PortabilityRequest> findByArcoRequest_Id(UUID requestId);
}