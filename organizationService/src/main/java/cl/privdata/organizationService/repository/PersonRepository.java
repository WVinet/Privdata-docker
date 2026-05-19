package cl.privdata.organizationService.repository;

import cl.privdata.organizationService.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PersonRepository extends JpaRepository<Person, UUID> {

    List<Person> findByOrganization_Id(UUID organizationId);

    List<Person> findByOrganization_IdAndIsActive(UUID organizationId, Boolean isActive);

    List<Person> findByOrganization_IdAndDepartment_Id(UUID organizationId, UUID departmentId);

    Optional<Person> findByIdAndOrganization_Id(UUID personId, UUID organizationId);

    boolean existsByOrganization_IdAndRut(UUID organizationId, String rut);

    boolean existsByOrganization_IdAndRutAndIdNot(UUID organizationId, String rut, UUID personId);

    boolean existsByOrganization_IdAndEmail(UUID organizationId, String email);

    boolean existsByOrganization_IdAndEmailAndIdNot(UUID organizationId, String email, UUID personId);
}
