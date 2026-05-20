package com.privdata.bff_api.controller;

import com.privdata.bff_api.client.ArcoClient;
import com.privdata.bff_api.client.AuthClient;
import com.privdata.bff_api.client.OrganizationClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestController {

    private final OrganizationClient organizationClient;
    private final AuthClient authClient;
    private final ArcoClient arcoClient;

    @GetMapping("/api/bff/health")
    public String health(){
        return "Privdata BFF funcionando correctamente";
    }

    @GetMapping("/auth")
    public String auth(){
        return authClient.health();
    }

    @GetMapping("/organization")
    public String organization() {
        return organizationClient.health();
    }

    @GetMapping("/arco")
    public String arco() {
        return arcoClient.health();
    }
}
