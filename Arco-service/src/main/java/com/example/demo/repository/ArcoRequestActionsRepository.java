package com.example.demo.repository;

import com.example.demo.model.ArcoRequestActions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ArcoRequestActionsRepository extends JpaRepository<ArcoRequestActions, UUID> {

    List<ArcoRequestActions> findByArcoRequest_IdOrderByExecutedAtAsc(UUID arcoRequestId);
}
