package cl.privdata.organizationService.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import cl.privdata.organizationService.model.JobPosition;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JobPositionRepository extends JpaRepository<JobPosition, UUID> {

    List<JobPosition> findByOrganization_Id(UUID organizationId);

    List<JobPosition> findByOrganization_IdAndIsActive(UUID organizationId, Boolean isActive);

    Optional<JobPosition> findByIdAndOrganization_Id(UUID jobPositionId, UUID organizationId);

    boolean existsByOrganization_IdAndName(UUID organizationId, String name);

    boolean existsByOrganization_IdAndNameAndIdNot(UUID organizationId, String name, UUID jobPositionId);
}
