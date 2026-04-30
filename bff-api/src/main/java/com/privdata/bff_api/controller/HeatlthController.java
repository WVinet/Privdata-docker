package com.privdata.bff_api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HeatlthController {

    @GetMapping("/api/bff/health")
    public String health(){
        return "Privdate BFF funcionando correctamente";
    }
}
