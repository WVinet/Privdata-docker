package com.example.demo.controller;

import com.example.demo.model.ArcoRequest;
import com.example.demo.service.ArcoRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/arco-request")
@RequiredArgsConstructor
public class ArcoRequestController {

    private final ArcoRequestService arcoRequestService;

    @GetMapping("/listar")
    public List<ArcoRequest> findAll(){
        return arcoRequestService.findAll();
    }

    @PostMapping
    public ResponseEntity<ArcoRequest> registrarSolicitud(@RequestBody ArcoRequest request){
        return new ResponseEntity<>(
                arcoRequestService.registrarSolicitud(request),
                HttpStatus.CREATED);
    }
}
