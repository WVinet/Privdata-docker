package com.example.demo.repository;

import com.example.demo.model.ArcoRequestEvidences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ArcoRequestEvidencesRepository extends JpaRepository<ArcoRequestEvidences, UUID> {

    List<ArcoRequestEvidences> findByArcoRequest_Id(UUID arcoRequestId);
}
