package com.privdata.authservice.config;

import com.privdata.authservice.model.Permission;
import com.privdata.authservice.model.Role;
import com.privdata.authservice.model.RolePermissions;
import com.privdata.authservice.repository.PermissionRepository;
import com.privdata.authservice.repository.RolePermissionRepository;
import com.privdata.authservice.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Override
    public void run(String... args){
        seedRoles();
        seedPermissions();
        seedRolePermissions();
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
