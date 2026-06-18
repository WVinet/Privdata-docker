package cl.privdata.organizationService.repository;

import cl.privdata.organizationService.model.ProcessingRestriction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProcessingRestrictionRepository extends JpaRepository<ProcessingRestriction, UUID> {

    boolean existsByPerson_IdAndTreatmentActivityId(UUID personId, UUID treatmentActivityId);

    List<ProcessingRestriction> findByPerson_Id(UUID personId);
}
