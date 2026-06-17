package com.privdata.bff_api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    //url definida en application.properties
    @Value("${frontend.url}")
    private String frontendUrl;

    //url del portal de la Agencia (Frontend-Agencia)
    @Value("${agencia.frontend.url}")
    private String agenciaFrontendUrl;

    //Bean que registra la configuracion CORS para todos los endpoints
    @Bean
    public WebMvcConfigurer corsConfigurer(){
        return new WebMvcConfigurer() {

            //Metodo donde se definen las reglas CORS
            @Override
            public void addCorsMappings(CorsRegistry registry){
                registry.addMapping("/api/**")//aplica CORS a rutas del BFF
                        .allowedOrigins(frontendUrl, agenciaFrontendUrl)//permite ambos frontends React
                        .allowedMethods("GET","POST","DELETE","PATCH","PUT","OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
