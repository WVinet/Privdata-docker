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

    public void sendRevisionEmail(String to, UUID requestId, String requestType) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("PrivData - Solicitud en revisión");
        message.setText("""
                Estimado/a:

                Tu solicitud: %s
                Motivo: %s
                Se encuentra en revisión.

                Nuestro equipo está revisando los antecedentes. Te notificaremos cuando avance el proceso.

                Atentamente,
                Equipo PrivData
                """.formatted(requestId, tipoLabel(requestType)));
        mailSender.send(message);
    }

    public void sendEnGestionEmail(String to, UUID requestId, String requestType) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("PrivData - Identidad verificada, solicitud en gestión");
        message.setText("""
                Estimado/a:

                Tu solicitud: %s
                Motivo: %s
                Se encuentra en gestión.

                Tu identidad fue verificada correctamente. La organización está procesando tu solicitud y recibirás una respuesta dentro del plazo legal establecido (Art. 11 Ley 21.719).

                Atentamente,
                Equipo PrivData
                """.formatted(requestId, tipoLabel(requestType)));
        mailSender.send(message);
    }

    private String tipoLabel(String requestType) {
        return switch (requestType) {
            case "ACCESO"          -> "Acceso a datos personales";
            case "RECTIFICACION"   -> "Rectificación de datos";
            case "SUPRESION"       -> "Supresión de datos";
            case "OPOSICION"       -> "Oposición al tratamiento";
            case "PORTABILIDAD"    -> "Portabilidad de datos";
            case "BLOQUEO_TEMPORAL"-> "Bloqueo temporal de datos";
            case "ANONIMIZACION"   -> "Anonimización de datos";
            default                -> requestType;
        };
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