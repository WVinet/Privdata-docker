package com.privdata.authservice.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

//    public void sendPasswordResetCode(String to, String code){
//        SimpleMailMessage message = new SimpleMailMessage();
//
//        message.setTo(to);
//
//        message.setSubject("Codigo de recuperacion - PrivData");
//
//        message.setText("Hola,\n\n" +
//                "Tu código de recuperación de contraseña es: " + code + "\n\n" +
//                "Este código expira en 10 minutos.\n\n" +
//                "Si no solicitaste este cambio, ignora este correo.\n\n" +
//                "Saludos,\n" +
//                "Equipo PrivData");
//
//        mailSender.send(message);
//    }

    public void sendPasswordResetCode(String to, String code) {

        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("Código de recuperación - PrivData");

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px;">
                    <h2 style="color: #111827;">PrivData</h2>

                    <p style="font-size: 16px; color: #374151;">
                        Recibimos una solicitud para restablecer tu contraseña.
                    </p>

                    <div style="background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0; font-size: 14px;">Tu código de verificación es:</p>
                        <h1 style="font-size: 36px; letter-spacing: 6px; margin: 12px 0;">%s</h1>
                    </div>

                    <p style="font-size: 14px; color: #6b7280;">
                        Este código expira en 10 minutos.
                    </p>

                    <p style="font-size: 14px; color: #6b7280;">
                        Si no solicitaste este cambio, puedes ignorar este correo.
                    </p>

                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

                    <p style="font-size: 12px; color: #9ca3af;">
                        Equipo PrivData
                    </p>
                </div>
                """.formatted(code);

            helper.setText(html, true);

            mailSender.send(message);

        } catch (Exception e) {
            throw new RuntimeException("Error al enviar correo de recuperación", e);
        }
    }
}
