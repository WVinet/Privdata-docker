package com.example.demo.arco.oposicion.repository;

import com.example.demo.arco.oposicion.model.OppositionRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OppositionRequestRepository extends JpaRepository<OppositionRequest, UUID> {

    Optional<OppositionRequest> findByArcoRequest_Id(UUID arcoRequestId);
}