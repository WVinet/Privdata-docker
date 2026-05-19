package cl.privdata.organizationService.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import cl.privdata.organizationService.model.Organization;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

    Optional<Organization> findByRut(String rut);

    Optional<Organization> findByEmail(String email);

    List<Organization> findAllByIsActive(Boolean isActive);
    boolean existsByRutAndIdNot(String rut, UUID id);

    
    boolean existsByRut(String rut);
}
