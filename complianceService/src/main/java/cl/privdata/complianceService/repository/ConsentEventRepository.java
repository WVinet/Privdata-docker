package cl.privdata.complianceService.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import cl.privdata.complianceService.model.ConsentEvent;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsentEventRepository extends JpaRepository<ConsentEvent, UUID> {

    List<ConsentEvent> findByConsentIdOrderByEventTimestampDesc(UUID consentId);
}