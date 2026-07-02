package com.privdata.authservice.security;

import com.privdata.authservice.dto.request.ActivateAccountRequestDTO;
import com.privdata.authservice.dto.request.InviteRequestDTO;
import com.privdata.authservice.dto.request.LoginRequestDTO;
import com.privdata.authservice.dto.request.RegisterRequestDTO;
import com.privdata.authservice.dto.response.InviteResponseDTO;
import com.privdata.authservice.dto.response.LoginResponseDTO;
import com.privdata.authservice.dto.response.MeResponseDTO;
import com.privdata.authservice.dto.response.RegisterResponseDTO;
import com.privdata.authservice.dto.response.UserResponseDTO;
import com.privdata.authservice.enums.UserStatus;
import com.privdata.authservice.exception.InvalidCredentialsException;
import com.privdata.authservice.model.Role;
import com.privdata.authservice.model.SecurityUser;
import com.privdata.authservice.model.User;
import com.privdata.authservice.model.UserRole;
import com.privdata.authservice.repository.UserRepository;
import com.privdata.authservice.repository.UserRoleRepository;
import com.privdata.authservice.service.AuthService;
import com.privdata.authservice.service.EmailService;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RoleService roleService;
    private final CustomUserDetailsService customUserDetailsService;
    private final EmailService emailService;

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
    public InviteResponseDTO invite(InviteRequestDTO request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El correo ya se encuentra registrado"
            );
        }

        if (userRepository.existsByPersonId(request.getPersonId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La persona ya tiene un usuario registrado"
            );
        }

        Role role = roleService.findByName(request.getRoleName());

        String tempPassword = "Tmp1@" + UUID.randomUUID().toString().replace("-", "").substring(0, 6);

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setStatus(UserStatus.PENDING);
        user.setActive(true);
        user.setOrganizationId(request.getOrganizationId());
        user.setPersonId(request.getPersonId());

        User savedUser = userRepository.save(user);

        UserRole userRole = new UserRole();
        userRole.setUser(savedUser);
        userRole.setRole(role);
        userRole.setActive(true);
        userRole.setAssignedAt(LocalDateTime.now());
        userRole.setAssignedBy(savedUser.getId());
        userRole.setExpiresAt(LocalDateTime.now().plusYears(99));
        userRoleRepository.save(userRole);

        emailService.sendInviteEmail(savedUser.getEmail(),  tempPassword);

        return new InviteResponseDTO(savedUser.getId(), savedUser.getEmail(), tempPassword);
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
    public List<UserResponseDTO> listUsers(UUID organizationId) {
        List<User> users = organizationId != null
                ? userRepository.findByOrganizationId(organizationId)
                : userRepository.findAll();
        return users.stream().map(this::toUserResponse).collect(Collectors.toList());
    }

    @Override
    public UserResponseDTO getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        return toUserResponse(user);
    }

    private UserResponseDTO toUserResponse(User user) {
        List<String> roles = user.getUserRoles().stream()
                .filter(ur -> Boolean.TRUE.equals(ur.getActive()))
                .map(ur -> ur.getRole().getName())
                .collect(Collectors.toList());

        return new UserResponseDTO(
                user.getId(),
                user.getEmail(),
                user.getOrganizationId(),
                user.getPersonId(),
                user.getStatus(),
                user.isActive(),
                roles,
                user.getLastLoginAt(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    @Override
    public LoginResponseDTO activateAccount(SecurityUser securityUser, ActivateAccountRequestDTO request) {
        User user = userRepository.findById(securityUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        SecurityUser updated = (SecurityUser) customUserDetailsService.loadUserByUsername(user.getEmail());
        return new LoginResponseDTO(jwtService.generateToken(updated));
    }

    @Override
    public void updateEmailByPersonId(UUID personId, String newEmail) {
        User user = userRepository.findByPersonId(personId).orElse(null);
        if (user == null) return;
        if (!user.getEmail().equalsIgnoreCase(newEmail) && userRepository.existsByEmail(newEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo ya está en uso por otro usuario");
        }
        user.setEmail(newEmail);
        userRepository.save(user);
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

    @Override
        public void resendInvite(UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuario no encontrado"));

        String tempPassword = UUID.randomUUID().toString().substring(0, 8);

        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setStatus(UserStatus.PENDING);

        userRepository.save(user);

        emailService.sendInviteEmail(
                user.getEmail(),
                tempPassword
        );
        }
}