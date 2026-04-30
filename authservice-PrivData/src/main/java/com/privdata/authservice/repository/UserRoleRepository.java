package com.privdata.authservice.repository;

import com.privdata.authservice.model.Role;
import com.privdata.authservice.model.User;
import com.privdata.authservice.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    List<UserRole> findByUser_Id(UUID userId);
    List<UserRole> findByUserAndActiveTrue(User user);
    boolean existsByUserAndRole(User user, Role role);
}