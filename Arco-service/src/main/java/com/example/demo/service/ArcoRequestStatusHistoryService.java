package com.example.demo.service;

import com.example.demo.repository.ArcoRequestStatusHistoryRepository;
import org.springframework.stereotype.Service;

import com.example.demo.model.ArcoRequestStatusHistory;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class ArcoRequestStatusHistoryService {
    private final ArcoRequestStatusHistoryRepository arcoRequestStatusHistoryRepository;

}
