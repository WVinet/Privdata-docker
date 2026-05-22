package com.privdata.authservice.repository;

import com.privdata.authservice.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    @EntityGraph(attributePaths = {"userRoles", "userRoles.role"})
    Optional<User> findByEmail(String email);

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role"})
    Optional<User> findById(UUID id);

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role"})
    java.util.List<User> findByOrganizationId(UUID organizationId);

    @EntityGraph(attributePaths = {"userRoles", "userRoles.role"})
    java.util.List<User> findAll();

    boolean existsByEmail(String email);
    boolean existsByPersonId(UUID personId);
}