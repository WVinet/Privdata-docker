package com.example.demo.arsop.common.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendRequestCreatedEmail(
            String to,
            UUID requestId,
            String requestType,
            String status
    ) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject("PrivData - Solicitud ARCO recibida");
        message.setText("""
                Estimado/a:

                Su solicitud ARCO ha sido recibida correctamente.

                Detalle de la solicitud:

                ID Solicitud: %s
                Tipo de solicitud: %s
                Estado actual: %s

                La organización responsable revisará su solicitud y le notificaremos cada cambio de estado.

                Atentamente,
                Equipo PrivData
                """.formatted(
                requestId,
                requestType,
                status
        ));

        mailSender.send(message);
    }

    public void sendStatusChangedEmail(
            String to,
            UUID requestId,
            String status,
            String comment
    ) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject("PrivData - Actualización de estado de solicitud ARCO");
        message.setText("""
                Estimado/a:

                Le informamos que su solicitud ARCO ha cambiado de estado.

                ID Solicitud: %s
                Nuevo estado: %s

                Comentario:
                %s

                Atentamente,
                Equipo PrivData
                """.formatted(
                requestId,
                status,
                comment != null && !comment.isBlank()
                        ? comment
                        : "Sin comentario adicional."
        ));

        mailSender.send(message);
    }

    public void sendResolutionEmail(
            String to,
            UUID requestId,
            String finalStatus,
            String resolutionSummary
    ) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(to);
        message.setSubject("PrivData - Resolución de solicitud ARCO");
        message.setText("""
                Estimado/a:

                Su solicitud ARCO ha sido resuelta.

                ID Solicitud: %s
                Estado final: %s

                Resultado / detalle:
                %s

                Atentamente,
                Equipo PrivData
                """.formatted(
                requestId,
                finalStatus,
                resolutionSummary != null && !resolutionSummary.isBlank()
                        ? resolutionSummary
                        : "Sin detalle adicional."
        ));

        mailSender.send(message);
    }
}