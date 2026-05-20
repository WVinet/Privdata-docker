package cl.privdata.complianceService.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import cl.privdata.complianceService.model.ConsentDataCategory;
import org.springframework.stereotype.Repository;

@Repository
public interface ConsentDataCategoryRepository extends JpaRepository<ConsentDataCategory, UUID> {

    List<ConsentDataCategory> findByConsentId(UUID consentId);

    void deleteByConsentId(UUID consentId);
}