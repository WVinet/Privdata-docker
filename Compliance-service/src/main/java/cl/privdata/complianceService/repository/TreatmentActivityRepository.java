package cl.privdata.complianceService.repository;

import cl.privdata.complianceService.model.TreatmentActivity;
import cl.privdata.complianceService.model.enums.TreatmentActivityStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TreatmentActivityRepository extends JpaRepository<TreatmentActivity, UUID> {
    List<TreatmentActivity> findByOrganizationId(UUID organizationId);
    List<TreatmentActivity> findByOrganizationIdAndStatus(UUID organizationId, TreatmentActivityStatus status);
}
