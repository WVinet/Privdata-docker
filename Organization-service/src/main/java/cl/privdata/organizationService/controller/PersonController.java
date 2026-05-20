package cl.privdata.organizationService.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import cl.privdata.organizationService.dto.request.PersonCreateRequestDTO;
import cl.privdata.organizationService.dto.request.PersonStatusUpdateRequestDTO;
import cl.privdata.organizationService.dto.request.PersonUpdateRequestDTO;
import cl.privdata.organizationService.dto.response.ApiResponseDTO;
import cl.privdata.organizationService.dto.response.PersonResponseDTO;
import cl.privdata.organizationService.service.PersonService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/organizations/{organizationId}/persons")
public class PersonController {

    private final PersonService personService;

    public PersonController(PersonService personService) {
        this.personService = personService;
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO<PersonResponseDTO>> create(
            @PathVariable UUID organizationId,
            @Valid @RequestBody PersonCreateRequestDTO request
    ) {
        PersonResponseDTO response = personService.create(organizationId, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponseDTO<>(
                        true,
                        "Persona creada correctamente",
                        response
                ));
    }

    @GetMapping
    public ResponseEntity<ApiResponseDTO<List<PersonResponseDTO>>> findAll(
            @PathVariable UUID organizationId,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) Boolean active
    ) {
        List<PersonResponseDTO> response = personService.findAll(organizationId, departmentId, active);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Personas obtenidas correctamente",
                response
        ));
    }

    @GetMapping("/{personId}")
    public ResponseEntity<ApiResponseDTO<PersonResponseDTO>> findById(
            @PathVariable UUID organizationId,
            @PathVariable UUID personId
    ) {
        PersonResponseDTO response = personService.findById(organizationId, personId);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Persona obtenida correctamente",
                response
        ));
    }

    @PutMapping("/{personId}")
    public ResponseEntity<ApiResponseDTO<PersonResponseDTO>> update(
            @PathVariable UUID organizationId,
            @PathVariable UUID personId,
            @Valid @RequestBody PersonUpdateRequestDTO request
    ) {
        PersonResponseDTO response = personService.update(organizationId, personId, request);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Persona actualizada correctamente",
                response
        ));
    }

    @PatchMapping("/{personId}/status")
    public ResponseEntity<ApiResponseDTO<PersonResponseDTO>> updateStatus(
            @PathVariable UUID organizationId,
            @PathVariable UUID personId,
            @Valid @RequestBody PersonStatusUpdateRequestDTO request
    ) {
        PersonResponseDTO response = personService.updateStatus(organizationId, personId, request);

        return ResponseEntity.ok(new ApiResponseDTO<>(
                true,
                "Estado de la persona actualizado correctamente",
                response
        ));
    }
}
