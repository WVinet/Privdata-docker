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
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Usuario no encontrado con email: " + email));

        List<UserRole> userRoles = userRoleRepository.findByUserAndActiveTrue(user);

        Set<GrantedAuthority> authorities = new HashSet<>();

        for (UserRole userRole : userRoles){
            Role role = userRole.getRole();

            List<RolePermissions> rolePermissions = rolePermissionsRepository.findByRoleAndIsActiveTrue(role);

            for (RolePermissions rolePermission : rolePermissions){
                Permission permission = rolePermission.getPermission();

                String authorityName = permission.getModule() + "_" + permission.getAction();

                authorities.add(new SimpleGrantedAuthority(authorityName));
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