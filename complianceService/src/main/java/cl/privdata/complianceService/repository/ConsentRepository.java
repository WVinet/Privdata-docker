package cl.privdata.complianceService.repository;

import java.util.UUID;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import cl.privdata.complianceService.model.Consent;
import cl.privdata.complianceService.model.enums.ConsentStatus;

public interface ConsentRepository extends JpaRepository<Consent, UUID> {

    Page<Consent> findByDataSubjectId(UUID dataSubjectId, Pageable pageable);

    Page<Consent> findByStatus(ConsentStatus status, Pageable pageable);

    Page<Consent> findByDataSubjectIdAndStatus(UUID dataSubjectId, ConsentStatus status, Pageable pageable);
}