package com.privdata.authservice.repository;

import com.privdata.authservice.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    //ademas de buscar al usuario por email, trae userRole y role en la  misma consulta
    @EntityGraph(attributePaths = {"userRoles", "userRoles.role"})
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByPersonId(UUID personId);
}