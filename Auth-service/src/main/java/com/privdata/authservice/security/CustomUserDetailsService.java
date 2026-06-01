package com.privdata.authservice.security;

import com.privdata.authservice.model.*;
import com.privdata.authservice.repository.RolePermissionRepository;
import com.privdata.authservice.repository.UserRepository;
import com.privdata.authservice.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RolePermissionRepository rolePermissionsRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Usuario no encontrado con email: " + email));

        List<UserRole> userRoles = userRoleRepository.findByUserAndActiveTrue(user);

        Set<GrantedAuthority> authorities = new HashSet<>();

        for (UserRole userRole : userRoles) {
            Role role = userRole.getRole();
            if (role == null) continue;

            // Rol con prefijo ROLE_ (convención Spring Security)
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));

            List<RolePermissions> rolePermissions = rolePermissionsRepository.findByRoleAndIsActiveTrue(role);

            for (RolePermissions rolePermission : rolePermissions) {
                Permission permission = rolePermission.getPermission();
                if (permission == null) continue;
                authorities.add(new SimpleGrantedAuthority(
                        permission.getModule() + "_" + permission.getAction()));
            }
        }

        return new SecurityUser(
                user.getId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.isActive(),
                authorities
        );
    }
}