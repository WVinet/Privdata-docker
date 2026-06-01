package com.privdata.authservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendPasswordResetCode(String to, String code){
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);

        message.setSubject("Codigo de recuperacion - PrivData");

        message.setText("Hola,\n\n" +
                "Tu código de recuperación de contraseña es: " + code + "\n\n" +
                "Este código expira en 10 minutos.\n\n" +
                "Si no solicitaste este cambio, ignora este correo.\n\n" +
                "Saludos,\n" +
                "Equipo PrivData");

        mailSender.send(message);
    }
}
