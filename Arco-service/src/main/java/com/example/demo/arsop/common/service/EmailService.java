package com.example.demo.arsop.common.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendRequestCreatedEmail(String to, UUID requestId, String requestType, String status) {
        String tipo  = tipoLabel(requestType);
        String html  = base("""
                <p style="font-size:16px;color:#374151;margin:0 0 16px;">
                    Tu solicitud de <strong>%s</strong> ha sido registrada correctamente en PrivData.
                </p>
                %s
                <p style="font-size:14px;color:#6b7280;">
                    La organización responsable revisará tu solicitud y te notificaremos por correo
                    en cada cambio de estado.
                </p>
                """.formatted(tipo, infoBox(
                    row("ID de solicitud", requestId.toString()),
                    row("Tipo",            tipo),
                    row("Estado actual",   estadoLabel(status))
                )));
        send(to, "PrivData — Solicitud ARSOP recibida", html);
    }

    public void sendStatusChangedEmail(String to, UUID requestId, String status, String comment) {
        String html = base("""
                <p style="font-size:16px;color:#374151;margin:0 0 16px;">
                    El estado de tu solicitud ha sido actualizado.
                </p>
                %s
                %s
                <p style="font-size:14px;color:#6b7280;">
                    Puedes revisar el detalle en el portal de seguimiento de PrivData.
                </p>
                """.formatted(
                    infoBox(
                        row("ID de solicitud", requestId.toString()),
                        row("Nuevo estado",    estadoLabel(status))
                    ),
                    (comment != null && !comment.isBlank())
                        ? commentBox(comment)
                        : ""
                ));
        send(to, "PrivData — Actualización de tu solicitud ARSOP", html);
    }

    public void sendRevisionEmail(String to, UUID requestId, String requestType) {
        String tipo = tipoLabel(requestType);
        String html = base("""
                <p style="font-size:16px;color:#374151;margin:0 0 16px;">
                    Tu solicitud de <strong>%s</strong> se encuentra en revisión.
                </p>
                %s
                <p style="font-size:14px;color:#6b7280;">
                    Nuestro equipo está revisando los antecedentes. Te notificaremos cuando avance el proceso.
                </p>
                """.formatted(tipo, infoBox(
                    row("ID de solicitud", requestId.toString()),
                    row("Tipo",            tipo)
                )));
        send(to, "PrivData — Solicitud en revisión", html);
    }

    public void sendEnGestionEmail(String to, UUID requestId, String requestType) {
        String tipo = tipoLabel(requestType);
        String html = base("""
                <p style="font-size:16px;color:#374151;margin:0 0 16px;">
                    Tu identidad fue verificada correctamente. Tu solicitud de <strong>%s</strong>
                    está siendo procesada.
                </p>
                %s
                <p style="font-size:14px;color:#6b7280;">
                    La organización tiene un plazo legal para responder tu solicitud (Art. 11 Ley 21.719).
                    Recibirás una notificación con la resolución.
                </p>
                """.formatted(tipo, infoBox(
                    row("ID de solicitud", requestId.toString()),
                    row("Tipo",            tipo),
                    row("Estado actual",   "En gestión")
                )));
        send(to, "PrivData — Identidad verificada, solicitud en gestión", html);
    }

    public void sendPortabilityReadyEmail(String to, UUID requestId) {
        String html = base("""
                <p style="font-size:16px;color:#374151;margin:0 0 16px;">
                    Tu solicitud de <strong>Portabilidad de datos</strong> ha sido aprobada
                    y tu archivo de datos ha sido generado correctamente.
                </p>
                %s
                <p style="font-size:14px;color:#374151;">
                    Para descargarlo, ingresa al portal PrivData y dirígete a:
                    <br/><strong>Mis solicitudes → Seguimiento</strong>
                </p>
                <p style="font-size:14px;color:#6b7280;">
                    El archivo en formato JSON contiene todos tus datos personales registrados
                    conforme al Art. 8 bis de la Ley 21.719.
                </p>
                """.formatted(infoBox(
                    row("ID de solicitud", requestId.toString()),
                    row("Estado",          "Archivo disponible para descarga")
                )));
        send(to, "PrivData — Tu archivo de portabilidad está disponible", html);
    }

    public void sendResolutionEmail(String to, UUID requestId, String finalStatus, String resolutionSummary) {
        String estado   = estadoLabel(finalStatus);
        boolean rejected = finalStatus != null &&
                           (finalStatus.equals("RECHAZADA") || finalStatus.equals("IDENTIDAD_RECHAZADA"));
        String boxColor = rejected ? "#fee2e2" : "#f0fdf4";
        String txtColor = rejected ? "#991b1b"  : "#166534";

        String summaryBlock = (resolutionSummary != null && !resolutionSummary.isBlank())
                ? commentBox(resolutionSummary)
                : "";

        String html = base("""
                <p style="font-size:16px;color:#374151;margin:0 0 16px;">
                    Tu solicitud ARSOP ha sido <strong>%s</strong>.
                </p>
                %s
                %s
                <p style="font-size:14px;color:#6b7280;">
                    Puedes revisar el detalle completo en el portal de seguimiento de PrivData.
                </p>
                """.formatted(
                    estado,
                    statusBadgeBox(estado, boxColor, txtColor),
                    summaryBlock
                ));
        send(to, "PrivData — Resolución de tu solicitud ARSOP", html);
    }

    // ── helpers ──────────────────────────────────────────────────────────────────

    private void send(String to, String subject, String html) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
            h.setTo(to);
            h.setSubject(subject);
            h.setText(html, true);
            mailSender.send(msg);
        } catch (Exception e) {
            System.out.println("Error al enviar correo: " + e.getMessage());
        }
    }

    private String base(String content) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
                    <h2 style="color:#111827;margin:0 0 8px;">PrivData</h2>
                    <p style="font-size:12px;color:#9ca3af;margin:0 0 24px;">
                        Sistema de gestión — Ley 21.719
                    </p>
                    %s
                    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;"/>
                    <p style="font-size:12px;color:#9ca3af;">Equipo PrivData — Ley 21.719</p>
                </div>
                """.formatted(content);
    }

    private String infoBox(String... rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div style=\"background:#f3f4f6;border-radius:8px;padding:16px 20px;margin:16px 0;\">");
        for (String row : rows) sb.append(row);
        sb.append("</div>");
        return sb.toString();
    }

    private String row(String label, String value) {
        return """
                <p style="margin:6px 0;font-size:14px;color:#374151;">
                    <span style="color:#6b7280;">%s:</span>&nbsp;&nbsp;<strong>%s</strong>
                </p>
                """.formatted(label, value);
    }

    private String commentBox(String text) {
        return """
                <div style="background:#eff6ff;border-left:3px solid #2563eb;
                            border-radius:4px;padding:12px 16px;margin:16px 0;">
                    <p style="font-size:14px;color:#1e40af;margin:0;">%s</p>
                </div>
                """.formatted(text.replace("\n", "<br/>"));
    }

    private String statusBadgeBox(String label, String bg, String color) {
        return """
                <div style="background:%s;border-radius:8px;padding:16px 20px;
                            text-align:center;margin:16px 0;">
                    <p style="font-size:18px;font-weight:bold;color:%s;margin:0;">%s</p>
                </div>
                """.formatted(bg, color, label);
    }

    private String tipoLabel(String requestType) {
        if (requestType == null) return "Solicitud";
        return switch (requestType) {
            case "ACCESO"        -> "Acceso a datos personales";
            case "RECTIFICACION" -> "Rectificación de datos";
            case "SUPRESION"     -> "Supresión de datos";
            case "OPOSICION"     -> "Oposición al tratamiento";
            case "PORTABILIDAD"  -> "Portabilidad de datos";
            default              -> requestType;
        };
    }

    private String estadoLabel(String status) {
        if (status == null) return "—";
        return switch (status) {
            case "RECIBIDA"             -> "Recibida";
            case "EN_GESTION"           -> "En gestión";
            case "RESPONDIDA"           -> "Respondida";
            case "RECHAZADA"            -> "Rechazada";
            case "IDENTIDAD_RECHAZADA"  -> "Identidad rechazada";
            case "PENDIENTE"            -> "Pendiente";
            default                     -> status;
        };
    }
}
