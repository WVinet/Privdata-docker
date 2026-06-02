package com.privdata.authservice.config;

import com.privdata.authservice.enums.UserStatus;
import com.privdata.authservice.model.*;
import com.privdata.authservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminProperties adminProperties;
    private final TitularProperties titularProperties;

    @Override
    public void run(String... args){
        seedRoles();
        seedPermissions();
        seedRolePermissions();
        seedSuperAdmin();
        seedTestTitular();
    }

    private void seedRoles(){
        List<String> roleNames = List.of(
                "SUPER_ADMIN",
                "ORG_ADMIN",
                "ANALYST",
                "AUDITOR",
                "END_USER"
        );

        for (String roleName : roleNames){
            if (!roleRepository.existsByName(roleName)){
                Role role = new Role();

                role.setName(roleName);
                role.setDescription("Rol base: " + roleName);
                role.setIsActive(true);
                role.setCreatedAt(LocalDateTime.now());

                roleRepository.save(role);
            }
        }
    }


    private void seedPermissions() {
        // Creamos los permisos base del sistema
        createPermissionIfNotExists("USER", "VIEW", "Ver usuarios");
        createPermissionIfNotExists("USER", "CREATE", "Crear usuarios");
        createPermissionIfNotExists("USER", "UPDATE", "Actualizar usuarios");
        createPermissionIfNotExists("USER", "DELETE", "Eliminar usuarios");

        createPermissionIfNotExists("ROLE", "VIEW", "Ver roles");
        createPermissionIfNotExists("ROLE", "ASSIGN", "Asignar roles");

        createPermissionIfNotExists("PERMISSION", "VIEW", "Ver permisos");

        createPermissionIfNotExists("ARCO", "VIEW", "Ver solicitudes ARCO");
        createPermissionIfNotExists("ARCO", "CREATE", "Crear solicitudes ARCO");
        createPermissionIfNotExists("ARCO", "RESOLVE", "Resolver solicitudes ARCO");

        createPermissionIfNotExists("RAT", "VIEW", "Ver registros RAT");
        createPermissionIfNotExists("RAT", "CREATE", "Crear registros RAT");
        createPermissionIfNotExists("RAT", "UPDATE", "Actualizar registros RAT");
        createPermissionIfNotExists("RAT", "EXPORT", "Exportar registros RAT");

        createPermissionIfNotExists("AUDIT", "VIEW", "Ver auditorías");
    }

    private void createPermissionIfNotExists(String module, String action, String description){
        //verificamos si ya existe el persmiso con la combinacion module + action
        if (!permissionRepository.existsByModuleAndAction(module, action)){
            Permission permission = new Permission();

            permission.setModule(module);
            permission.setAction(action);
            permission.setDescription(description);
            permission.setActive(true);

            permission.setCreatedAt(LocalDateTime.now());

            permissionRepository.save(permission);
        }
    }

    private void seedRolePermissions() {
        // SUPER_ADMIN tendrá todos los permisos
        assignAllPermissionsToRole("SUPER_ADMIN");

        // ORG_ADMIN tendrá permisos de administración operativa
        assignPermissionToRole("ORG_ADMIN", "USER", "VIEW");
        assignPermissionToRole("ORG_ADMIN", "USER", "CREATE");
        assignPermissionToRole("ORG_ADMIN", "USER", "UPDATE");
        assignPermissionToRole("ORG_ADMIN", "ROLE", "VIEW");
        assignPermissionToRole("ORG_ADMIN", "ROLE", "ASSIGN");
        assignPermissionToRole("ORG_ADMIN", "ARCO", "VIEW");
        assignPermissionToRole("ORG_ADMIN", "ARCO", "CREATE");
        assignPermissionToRole("ORG_ADMIN", "ARCO", "RESOLVE");
        assignPermissionToRole("ORG_ADMIN", "RAT", "VIEW");
        assignPermissionToRole("ORG_ADMIN", "RAT", "CREATE");
        assignPermissionToRole("ORG_ADMIN", "RAT", "UPDATE");
        assignPermissionToRole("ORG_ADMIN", "RAT", "EXPORT");
        assignPermissionToRole("ORG_ADMIN", "AUDIT", "VIEW");

        // ANALYST tendrá permisos funcionales, no tan administrativos
        assignPermissionToRole("ANALYST", "ARCO", "VIEW");
        assignPermissionToRole("ANALYST", "ARCO", "CREATE");
        assignPermissionToRole("ANALYST", "ARCO", "RESOLVE");
        assignPermissionToRole("ANALYST", "RAT", "VIEW");
        assignPermissionToRole("ANALYST", "RAT", "CREATE");
        assignPermissionToRole("ANALYST", "RAT", "UPDATE");

        // AUDITOR tendrá permisos de solo lectura
        assignPermissionToRole("AUDITOR", "AUDIT", "VIEW");
        assignPermissionToRole("AUDITOR", "ARCO", "VIEW");
        assignPermissionToRole("AUDITOR", "RAT", "VIEW");
        assignPermissionToRole("AUDITOR", "USER", "VIEW");
        assignPermissionToRole("AUDITOR", "ROLE", "VIEW");
        assignPermissionToRole("AUDITOR", "PERMISSION", "VIEW");

        //END_USER tendra permisos ARCO y RAT de lectura y ARCO creacion
        assignPermissionToRole("END_USER", "ARCO", "VIEW");
        assignPermissionToRole("END_USER", "ARCO", "CREATE");
        assignPermissionToRole("END_USER", "RAT", "VIEW");
    }

    private void seedSuperAdmin() {
        Role superAdminRole = roleRepository.findByName("SUPER_ADMIN")
                .orElseThrow(() -> new RuntimeException("Rol SUPER_ADMIN no encontrado"));

        if (userRepository.existsByEmail(adminProperties.getEmail())) {
            // Patch missing organizationId / personId for existing admin (back-fill)
            userRepository.findByEmail(adminProperties.getEmail()).ifPresent(existing -> {
                boolean changed = false;
                if (existing.getOrganizationId() == null) {
                    existing.setOrganizationId(UUID.fromString(adminProperties.getOrganizationId()));
                    changed = true;
                }
                if (existing.getPersonId() == null) {
                    existing.setPersonId(UUID.fromString(adminProperties.getPersonId()));
                    changed = true;
                }
                if (changed) userRepository.save(existing);
            });
            return;
        }

        User admin = new User();
        admin.setEmail(adminProperties.getEmail());
        admin.setPasswordHash(passwordEncoder.encode(adminProperties.getPassword()));
        admin.setOrganizationId(UUID.fromString(adminProperties.getOrganizationId()));
        admin.setPersonId(UUID.fromString(adminProperties.getPersonId()));
        admin.setStatus(UserStatus.ACTIVE);
        admin.setActive(true);
        admin.setFailedLoginAttempts(0);
        admin.setLockedUntil(LocalDateTime.now());
        admin.setPasswordChangedAt(LocalDateTime.now());

        User savedAdmin = userRepository.save(admin);

        UserRole userRole = new UserRole();
        userRole.setUser(savedAdmin);
        userRole.setRole(superAdminRole);
        userRole.setActive(true);
        userRole.setAssignedBy(savedAdmin.getId());
        userRole.setExpiresAt(LocalDateTime.now().plusYears(99));

        userRoleRepository.save(userRole);
    }

    private void assignAllPermissionsToRole(String roleName) {
        // Buscamos el rol por nombre
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado: " + roleName));

        // Obtenemos todos los permisos existentes
        List<Permission> permissions = permissionRepository.findAll();

        // Asignamos cada permiso al rol si aún no existe la relación
        for (Permission permission : permissions) {
            if (!rolePermissionRepository.existsByRoleAndPermission(role, permission)) {
                RolePermissions rolePermission = new RolePermissions();

                // Rol al que se le asigna el permiso
                rolePermission.setRole(role);

                // Permiso asignado
                rolePermission.setPermission(permission);

                // Guardamos la relación
                rolePermissionRepository.save(rolePermission);
            }
        }
    }

    private void seedTestTitular() {

        UUID titularPersonId = UUID.fromString(titularProperties.getPersonId());
        if (userRepository.existsByEmail(titularProperties.getEmail())) return;

        Role endUserRole = roleRepository.findByName("END_USER")
                .orElseThrow(() -> new RuntimeException("Rol END_USER no encontrado"));

        User titular = new User();
        titular.setEmail(titularProperties.getEmail());
        titular.setPasswordHash(passwordEncoder.encode(titularProperties.getPassword()));
        titular.setOrganizationId(UUID.fromString(adminProperties.getOrganizationId()));
        titular.setPersonId(titularPersonId);
        titular.setStatus(UserStatus.ACTIVE);
        titular.setActive(true);
        titular.setFailedLoginAttempts(0);
        titular.setLockedUntil(LocalDateTime.now());
        titular.setPasswordChangedAt(LocalDateTime.now());

        User savedTitular = userRepository.save(titular);

        UserRole userRole = new UserRole();
        userRole.setUser(savedTitular);
        userRole.setRole(endUserRole);
        userRole.setActive(true);
        userRole.setAssignedBy(savedTitular.getId());
        userRole.setExpiresAt(LocalDateTime.now().plusYears(99));

        userRoleRepository.save(userRole);
    }

    private void assignPermissionToRole(String roleName, String module, String action) {
        // Buscamos el rol
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Rol no encontrado: " + roleName));

        // Buscamos el permiso por módulo + acción
        Permission permission = permissionRepository.findByModuleAndAction(module, action)
                .orElseThrow(() -> new RuntimeException(
                        "Permiso no encontrado: " + module + "_" + action
                ));

        // Si la relación no existe, la creamos
        if (!rolePermissionRepository.existsByRoleAndPermission(role, permission)) {
            RolePermissions rolePermission = new RolePermissions();

            // Rol asociado
            rolePermission.setRole(role);

            // Permiso asociado
            rolePermission.setPermission(permission);

            rolePermissionRepository.save(rolePermission);
        }
    }


}
