package com.example.demo.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientResponseException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ArcoRequestNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ArcoRequestNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String errores = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return buildResponse(HttpStatus.BAD_REQUEST, errores);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(RestClientResponseException.class)
    public ResponseEntity<Map<String, Object>> handleUpstreamServiceError(RestClientResponseException ex) {
        HttpStatusCode upstreamStatus = ex.getStatusCode();
        HttpStatus status = upstreamStatus.is4xxClientError()
                ? HttpStatus.resolve(upstreamStatus.value())
                : HttpStatus.BAD_GATEWAY;
        if (status == null) {
            status = HttpStatus.BAD_GATEWAY;
        }
        String mensaje = extractUpstreamMessage(ex);
        log.warn("Error de servicio externo ({}): {}", upstreamStatus, mensaje);
        return buildResponse(status, mensaje);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, ex.getMessage() != null ? ex.getMessage() : "Error interno del servidor");
    }

    private static final Pattern MESSAGE_FIELD = Pattern.compile("\"message\"\\s*:\\s*\"([^\"]*)\"");

    private String extractUpstreamMessage(RestClientResponseException ex) {
        String body = ex.getResponseBodyAsString();
        if (body != null && !body.isBlank()) {
            Matcher matcher = MESSAGE_FIELD.matcher(body);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return "El servicio relacionado rechazó la operación (" + ex.getStatusCode().value() + ").";
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatus status, String mensaje) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("mensaje", mensaje);
        return ResponseEntity.status(status).body(body);
    }
}
