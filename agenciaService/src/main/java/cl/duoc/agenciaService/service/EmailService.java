package cl.duoc.agenciaService.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendClaimResponseEmail(String to, UUID arcoRequestId, String response) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject("Agencia de Protección de Datos - Respuesta a su reclamo");
        message.setText("""
                Estimado/a:

                La Agencia de Protección de Datos Personales ha respondido a su reclamo
                relacionado con la solicitud ARCO N° %s.

                Respuesta:
                %s

                Puede revisar el detalle completo en el portal de PrivData.

                Atentamente,
                Agencia de Protección de Datos Personales
                """.formatted(arcoRequestId, response));

        mailSender.send(message);
    }
}
