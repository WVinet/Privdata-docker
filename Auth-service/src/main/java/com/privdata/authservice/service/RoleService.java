package com.privdata.authservice.service;

import com.privdata.authservice.model.Role;
import com.privdata.authservice.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    public Role findByName(String name){
        return roleRepository.findByName(name)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Rol no encontrado con nombre: " + name
                ));
    }

    public Role findById(Integer id){
        return roleRepository.findById(id)
                .orElseThrow(()-> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "El rol no existe"
                ));
    }

    public List<Role> findAll(){
        return roleRepository.findAll();
    }
}
