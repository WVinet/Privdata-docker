package com.example.demo.arco.rectificacion.repository;

import com.example.demo.arco.rectificacion.model.RectificationRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RectificationRequestRepository extends JpaRepository<RectificationRequest, UUID> {
    Optional<RectificationRequest> findByArcoRequest_Id(UUID arcoRequestId);
}