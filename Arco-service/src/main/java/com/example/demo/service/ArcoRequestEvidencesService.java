package com.example.demo.service;

import org.springframework.stereotype.Service;

import com.example.demo.repository.ArcoRequestEvidencesRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ArcoRequestEvidencesService {
    private final ArcoRequestEvidencesRepository arcoRequestEvidencesRepository;

}
