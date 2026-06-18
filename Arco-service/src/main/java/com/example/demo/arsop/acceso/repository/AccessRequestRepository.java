package com.example.demo.arsop.acceso.repository;

import com.example.demo.arsop.acceso.model.AccessRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AccessRequestRepository extends JpaRepository<AccessRequest, UUID> {

    Optional<AccessRequest> findByArcoRequest_Id(UUID arcoRequestId);


}