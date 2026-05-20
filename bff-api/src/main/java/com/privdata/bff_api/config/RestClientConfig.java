package com.privdata.bff_api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

//configuracion HTTP para consumir microservicios
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient organizationRestClient(
            @Value("${services.organization.url}") String baseUrl
    ) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }
}
