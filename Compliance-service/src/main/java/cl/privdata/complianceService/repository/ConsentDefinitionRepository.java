package cl.privdata.complianceService.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import cl.privdata.complianceService.model.ConsentDefinition;

@Repository
public interface ConsentDefinitionRepository extends JpaRepository<ConsentDefinition, UUID> {

    List<ConsentDefinition> findByOrganizationIdAndActiveTrue(UUID organizationId);

    boolean existsByTitleAndOrganizationId(String title, UUID organizationId);

    @Query("""
            SELECT d FROM ConsentDefinition d
            WHERE d.organizationId = :orgId
              AND d.active = true
              AND d.id NOT IN (
                SELECT c.definitionId FROM Consent c
                WHERE c.dataSubjectId = :personId
                  AND c.definitionId IS NOT NULL
              )
            """)
    List<ConsentDefinition> findPendingForPerson(@Param("orgId") UUID orgId, @Param("personId") UUID personId);
}
