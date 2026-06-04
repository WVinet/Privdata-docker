package com.example.demo.arco.opposition.repository;

import com.example.demo.arco.opposition.model.AgencyClaim;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgencyClaimRepository extends JpaRepository<AgencyClaim, UUID> {

    List<AgencyClaim> findByOppositionRequestId(UUID oppositionRequestId);
}
