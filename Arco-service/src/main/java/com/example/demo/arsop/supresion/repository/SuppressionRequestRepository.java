package com.example.demo.arsop.supresion.repository;

import com.example.demo.arsop.supresion.model.SuppressionRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SuppressionRequestRepository extends JpaRepository<SuppressionRequest, UUID> {
    Optional<SuppressionRequest> findByArcoRequest_Id(UUID arcoRequestId);
}