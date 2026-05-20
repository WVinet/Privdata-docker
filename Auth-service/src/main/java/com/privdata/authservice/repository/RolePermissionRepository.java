package com.privdata.authservice.repository;

import com.privdata.authservice.model.Permission;
import com.privdata.authservice.model.Role;
import com.privdata.authservice.model.RolePermissions;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RolePermissionRepository extends JpaRepository<RolePermissions, UUID> {
    boolean existsByRoleAndPermission(Role role, Permission permission);
    List<RolePermissions> findByRoleAndIsActiveTrue(Role role);
}
