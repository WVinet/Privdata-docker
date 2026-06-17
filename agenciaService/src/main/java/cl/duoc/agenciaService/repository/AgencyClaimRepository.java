package cl.duoc.agenciaService.repository;

import cl.duoc.agenciaService.enums.AgencyClaimStatus;
import cl.duoc.agenciaService.model.AgencyClaim;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AgencyClaimRepository extends JpaRepository<AgencyClaim, UUID> {
    Page<AgencyClaim> findByStatus(AgencyClaimStatus status, Pageable pageable);
}
