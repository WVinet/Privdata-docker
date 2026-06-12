package com.example.demo.dto.request;

import lombok.Data;

@Data
public class PersonRectificationRequestDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String position;
    private String rut;
}
