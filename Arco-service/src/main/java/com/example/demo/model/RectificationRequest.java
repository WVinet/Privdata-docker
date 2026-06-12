package com.example.demo.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class RectificationRequest {

    @Id
    UUID id;

    @OneToOne
    private ArcoRequest arcoRequest;

    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String position;
    private String rut;
}
