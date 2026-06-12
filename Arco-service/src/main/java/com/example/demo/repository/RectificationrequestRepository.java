package com.example.demo.repository;


import com.example.demo.model.RectificationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RectificationRequestRepository extends JpaRepository<RectificationRequest, UUID> {

    Optional<RectificationRequest> findByArcoRequest_Id(UUID arcoRequestId);
}
