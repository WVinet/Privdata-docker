package cl.privdata.complianceService.repository;

import cl.privdata.complianceService.model.Tercero;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TerceroRepository extends JpaRepository<Tercero, UUID> {
    List<Tercero> findByOrganizationId(UUID organizationId);
    List<Tercero> findByOrganizationIdAndActivo(UUID organizationId, boolean activo);
}
