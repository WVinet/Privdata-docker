package com.privdata.bff_api.util;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class JwtUtil {

    private static final Pattern SUB_PATTERN =
            Pattern.compile("\"sub\"\\s*:\\s*\"([^\"]+)\"");

    public static String extractEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return "Sistema";
        try {
            String token   = authHeader.substring(7);
            String[] parts = token.split("\\.");
            if (parts.length < 2) return "Sistema";

            String payload = parts[1];
            int padding = (4 - payload.length() % 4) % 4;
            payload = payload + "=".repeat(padding);

            byte[] decoded = Base64.getUrlDecoder().decode(payload);
            String json    = new String(decoded, StandardCharsets.UTF_8);

            Matcher m = SUB_PATTERN.matcher(json);
            return m.find() ? m.group(1) : "Sistema";
        } catch (Exception e) {
            return "Sistema";
        }
    }

    private JwtUtil() {}
}
