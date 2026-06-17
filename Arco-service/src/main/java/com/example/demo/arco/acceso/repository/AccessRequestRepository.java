package com.example.demo.arco.acceso.repository;

import com.example.demo.arco.acceso.model.AccessRequest;
import com.example.demo.enums.arcoRequest.ArcoRequestType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface AccessRequestRepository extends JpaRepository<AccessRequest, UUID> {

    Optional<AccessRequest> findByArcoRequest_Id(UUID arcoRequestId);


}