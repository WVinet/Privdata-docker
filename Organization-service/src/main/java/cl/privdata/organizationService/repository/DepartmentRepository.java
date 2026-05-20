package cl.privdata.organizationService.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import cl.privdata.organizationService.model.Department;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    List<Department> findByOrganization_Id(UUID organizationId);

    List<Department> findByOrganization_IdAndIsActive(UUID organizationId, Boolean isActive);

    Optional<Department> findByIdAndOrganization_Id(UUID departmentId, UUID organizationId);

    boolean existsByOrganization_IdAndName(UUID organizationId, String name);

    boolean existsByOrganization_IdAndNameAndIdNot(UUID organizationId, String name, UUID departmentId);
}
