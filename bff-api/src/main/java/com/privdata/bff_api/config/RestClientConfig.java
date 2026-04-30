package com.privdata.bff_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

//configuracion HTTP para consumir microservicios
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient restClient(){
        return RestClient.create();//Cliente http simple de spring
    }
}
