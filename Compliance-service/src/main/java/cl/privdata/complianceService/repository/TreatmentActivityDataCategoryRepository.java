package cl.privdata.complianceService.repository;

import cl.privdata.complianceService.model.TreatmentActivityDataCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TreatmentActivityDataCategoryRepository extends JpaRepository<TreatmentActivityDataCategory, UUID> {
    List<TreatmentActivityDataCategory> findByTreatmentActivityId(UUID treatmentActivityId);
    void deleteByTreatmentActivityId(UUID treatmentActivityId);
}
