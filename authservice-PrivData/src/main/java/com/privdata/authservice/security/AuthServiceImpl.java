package com.privdata.authservice.security;

import com.privdata.authservice.dto.request.LoginRequestDTO;
import com.privdata.authservice.dto.request.RegisterRequestDTO;
import com.privdata.authservice.dto.response.LoginResponseDTO;
import com.privdata.authservice.dto.response.MeResponseDTO;
import com.privdata.authservice.dto.response.RegisterResponseDTO;
import com.privdata.authservice.enums.UserStatus;
import com.privdata.authservice.exception.InvalidCredentialsException;
import com.privdata.authservice.model.Role;
import com.privdata.authservice.model.SecurityUser;
import com.privdata.authservice.model.User;
import com.privdata.authservice.model.UserRole;
import com.privdata.authservice.repository.UserRepository;
import com.privdata.authservice.repository.UserRoleRepository;
import com.privdata.authservice.service.AuthService;
import com.privdata.authservice.service.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RoleService roleService;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    public RegisterResponseDTO register(RegisterRequestDTO request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El correo ya se encuentra registrado"
            );
        }

        if (userRepository.existsByPersonId(request.getPersonId())){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La persona ya tiene un usuario registrado"
            );
        }


        Role defaultRole = roleService.findByName("END_USER");

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.ACTIVE);
        user.setActive(true);
        user.setOrganizationId(request.getOrganizationId());
        user.setPersonId(request.getPersonId());

        User savedUser = userRepository.save(user);

        UserRole userRole = new UserRole();
        userRole.setUser(savedUser);
        userRole.setRole(defaultRole);
        userRole.setActive(true);
        userRole.setAssignedAt(LocalDateTime.now());

        userRoleRepository.save(userRole);

        return new RegisterResponseDTO(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getStatus(),
                savedUser.getOrganizationId(),
                savedUser.getPersonId()
        );
    }

    @Override
    public LoginResponseDTO login(LoginRequestDTO request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        if (user.getStatus() != UserStatus.ACTIVE && user.getStatus() != UserStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Usuario no habilitado para iniciar sesión"
            );
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        SecurityUser securityUser = (SecurityUser) customUserDetailsService.loadUserByUsername(user.getEmail());
        String jwtToken = jwtService.generateToken(securityUser);

        return new LoginResponseDTO(jwtToken);
    }

    public MeResponseDTO me(SecurityUser securityUser) {
        User user = userRepository.findById(securityUser.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuario no encontrado"
                ));

        List<String> authorities = securityUser.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return new MeResponseDTO(
                user.getId(),
                user.getEmail(),
                user.getOrganizationId(),
                user.getPersonId(),
                user.getStatus(),
                authorities
        );
    }

    @Override
    public void assignRoleToUser(UUID userId, String roleName) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuario no encontrado"
                ));

        Role role = roleService.findByName(roleName);

        if (userRoleRepository.existsByUserAndRole(user, role)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El usuario ya tiene asignado ese rol"
            );
        }

        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(role);
        userRole.setActive(true);
        userRole.setAssignedAt(LocalDateTime.now());

        userRoleRepository.save(userRole);
    }
}