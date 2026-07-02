package cl.privdata.complianceService.repository;

import cl.privdata.complianceService.model.TreatmentActivityDataCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TreatmentActivityDataCategoryRepository extends JpaRepository<TreatmentActivityDataCategory, UUID> {
    List<TreatmentActivityDataCategory> findByTreatmentActivityId(UUID treatmentActivityId);

    @Modifying
    @Query("DELETE FROM TreatmentActivityDataCategory t WHERE t.treatmentActivityId = :id")
    void deleteByTreatmentActivityId(@Param("id") UUID id);
}
