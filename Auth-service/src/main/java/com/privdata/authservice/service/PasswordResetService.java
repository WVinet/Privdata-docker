package com.privdata.authservice.service;

import com.privdata.authservice.dto.request.ResetPasswordRequest;
import com.privdata.authservice.model.PasswordResetCode;
import com.privdata.authservice.model.User;
import com.privdata.authservice.repository.PasswordResetCodeRepository;
import com.privdata.authservice.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
    public void requestPasswordReset(String email){

        User user = userRepository.findByEmail(email)
                .orElseThrow(()-> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No existe un usuario con ese correo"
                ));

        passwordResetCodeRepository.deleteByEmail(email);

        String code = String.valueOf(new Random().nextInt(900000) + 100000);

        PasswordResetCode resetCode = PasswordResetCode.builder()
                .email(email)
                .code(code)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        passwordResetCodeRepository.save(resetCode);

        emailService.sendPasswordResetCode(email, code);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request){
        PasswordResetCode resetCode = passwordResetCodeRepository
                .findTopByEmailAndCodeAndUsedFalseOrderByExpiresAtDesc(
                        request.getEmail(),
                        request.getCode()
                ).orElseThrow(()-> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Codigo invalido"
                ));

        if (resetCode.getExpiresAt().isBefore(LocalDateTime.now())){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El codigo expiro"
            );
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuario no encontrado"
                ));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetCode.setUsed(true);
        passwordResetCodeRepository.save(resetCode);
    }
}
