package com.privdata.bff_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

// Configuración básica de seguridad del BFF
@Configuration
public class SecurityConfig {

    // Define las reglas de seguridad HTTP
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        return http
                // Desactivamos CSRF porque el BFF será consumido como API REST
                .csrf(csrf -> csrf.disable())

                // Activamos CORS usando la configuración definida en CorsConfig
                .cors(cors -> {})

                // Definimos permisos por endpoint
                .authorizeHttpRequests(auth -> auth
                        // Permitimos el endpoint de prueba sin login
                        .requestMatchers("/api/bff/health").permitAll()

                        // Por ahora permitimos todo para avanzar rápido
                        .anyRequest().permitAll()
                )

                // Construimos la configuración final
                .build();
    }
}
