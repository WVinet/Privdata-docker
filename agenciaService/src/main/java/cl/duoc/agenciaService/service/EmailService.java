package cl.duoc.agenciaService.service;

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

    public void sendClaimResponseEmail(String to, UUID arcoRequestId, String response) {
        String html = base("""
                <p style="font-size:16px;color:#374151;margin:0 0 16px;">
                    La <strong>Agencia de Protección de Datos Personales</strong> ha respondido
                    al reclamo relacionado con tu solicitud ARSOP.
                </p>
                %s
                %s
                <p style="font-size:14px;color:#6b7280;">
                    Puedes revisar el detalle completo de esta y otras solicitudes en el portal de seguimiento de PrivData.
                </p>
                """.formatted(
                infoBox(row("N° de solicitud ARSOP", arcoRequestId.toString())),
                commentBox(response)
        ));
        send(to, "Agencia de Protección de Datos — Respuesta a tu reclamo", html);
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
                    <p style="font-size:12px;color:#9ca3af;">Agencia de Protección de Datos Personales — Ley 21.719</p>
                </div>
                """.formatted(content);
    }

    private String infoBox(String... rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("<div style=\"background:#f3f4f6;border-radius:8px;padding:16px 20px;margin:16px 0;\">");
        for (String r : rows) sb.append(r);
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
                    <p style="font-size:14px;color:#1e40af;margin:0;white-space:pre-wrap;">%s</p>
                </div>
                """.formatted(text != null ? text.replace("\n", "<br/>") : "");
    }
}
