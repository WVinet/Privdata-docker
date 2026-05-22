package cl.privdata.complianceService.repository;

import cl.privdata.complianceService.model.DataCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DataCategoryRepository extends JpaRepository<DataCategory, UUID> {
    List<DataCategory> findByActiveTrue();
    boolean existsByName(String name);
}
