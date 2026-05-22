package com.example.demo.repository;

import com.example.demo.enums.arcoRequest.ArcoStatus;
import com.example.demo.model.ArcoRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ArcoRequestRepository extends JpaRepository<ArcoRequest, UUID> {

    List<ArcoRequest> findByOrganizationId(UUID organizationId);

    List<ArcoRequest> findByDataSubjectId(UUID dataSubjectId);

    List<ArcoRequest> findByStatus(ArcoStatus status);

    List<ArcoRequest> findByOrganizationIdAndStatus(UUID organizationId, ArcoStatus status);
}
