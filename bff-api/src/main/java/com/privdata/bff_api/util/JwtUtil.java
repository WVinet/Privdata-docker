package com.privdata.bff_api.util;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class JwtUtil {

    private static final Pattern SUB_PATTERN =
            Pattern.compile("\"sub\"\\s*:\\s*\"([^\"]+)\"");

    private static final Pattern USER_ID_PATTERN =
            Pattern.compile("\"userId\"\\s*:\\s*\"([^\"]+)\"");

    public static String extractEmail(String authHeader) {
        String json = decodePayload(authHeader);
        if (json == null) return "Sistema";

        Matcher m = SUB_PATTERN.matcher(json);
        return m.find() ? m.group(1) : "Sistema";
    }

    public static String extractUserId(String authHeader) {
        String json = decodePayload(authHeader);
        if (json == null) return null;

        Matcher m = USER_ID_PATTERN.matcher(json);
        return m.find() ? m.group(1) : null;
    }

    private static String decodePayload(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            String token   = authHeader.substring(7);
            String[] parts = token.split("\\.");
            if (parts.length < 2) return null;

            String payload = parts[1];
            int padding = (4 - payload.length() % 4) % 4;
            payload = payload + "=".repeat(padding);

            byte[] decoded = Base64.getUrlDecoder().decode(payload);
            return new String(decoded, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    private JwtUtil() {}
}
