package com.example.demo.arsop.solicitudesAdicionales.bloqueo.repository;

import com.example.demo.arsop.solicitudesAdicionales.bloqueo.model.BlockingRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BlockingRequestRepository
        extends JpaRepository<BlockingRequest, UUID> {

    Optional<BlockingRequest> findByArcoRequest_Id(UUID requestId);
}