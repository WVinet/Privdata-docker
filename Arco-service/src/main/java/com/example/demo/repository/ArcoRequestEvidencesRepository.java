package com.example.demo.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.ArcoRequestEvidences;

@Repository
public interface ArcoRequestEvidencesRepository extends JpaRepository <ArcoRequestEvidences, UUID>  {

}
