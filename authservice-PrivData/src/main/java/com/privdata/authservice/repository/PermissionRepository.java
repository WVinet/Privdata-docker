package com.privdata.authservice.repository;

import com.privdata.authservice.model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PermissionRepository extends JpaRepository<Permission,UUID> {
    Optional<Permission> findByModuleAndAction(String module, String action);
    boolean existsByModuleAndAction(String module, String action);
}
