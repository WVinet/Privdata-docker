package cl.privdata.organizationService.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.privdata.organizationService.dto.request.PersonCreateRequestDTO;
import cl.privdata.organizationService.dto.request.PersonStatusUpdateRequestDTO;
import cl.privdata.organizationService.dto.request.PersonUpdateRequestDTO;
import cl.privdata.organizationService.dto.response.PersonResponseDTO;
import cl.privdata.organizationService.model.Department;
import cl.privdata.organizationService.model.Organization;
import cl.privdata.organizationService.model.Person;
import cl.privdata.organizationService.repository.DepartmentRepository;
import cl.privdata.organizationService.repository.OrganizationRepository;
import cl.privdata.organizationService.repository.PersonRepository;


@Service
@Transactional
public class PersonService {

    private final PersonRepository personRepository;
    private final OrganizationRepository organizationRepository;
    private final DepartmentRepository departmentRepository;

    public PersonService(
            PersonRepository personRepository,
            OrganizationRepository organizationRepository,
            DepartmentRepository departmentRepository
    ) {
        this.personRepository = personRepository;
        this.organizationRepository = organizationRepository;
        this.departmentRepository = departmentRepository;
    }

    public PersonResponseDTO create(UUID organizationId, PersonCreateRequestDTO request) {
        Organization organization = getOrganizationOrThrow(organizationId);

        validateUniqueFieldsForCreate(organizationId, request.getRut(), request.getEmail());

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = getDepartmentOrThrow(organizationId, request.getDepartmentId());
        }

        Person person = new Person();
        person.setOrganization(organization);
        person.setDepartment(department);
        person.setFirstName(request.getFirstName());
        person.setLastName(request.getLastName());
        person.setFullName(buildFullName(request.getFirstName(), request.getLastName()));
        person.setRut(request.getRut());
        person.setEmail(request.getEmail());
        person.setPhone(request.getPhone());
        person.setPosition(request.getPosition());
        person.setIsActive(true);

        Person saved = personRepository.save(person);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PersonResponseDTO> findAll(UUID organizationId, UUID departmentId, Boolean active) {
        getOrganizationOrThrow(organizationId);

        List<Person> persons;

        if (departmentId != null) {
            persons = personRepository.findByOrganization_IdAndDepartment_Id(organizationId, departmentId);
            if (active != null) {
                persons = persons.stream()
                        .filter(person -> person.getIsActive().equals(active))
                        .toList();
            }
        } else if (active != null) {
            persons = personRepository.findByOrganization_IdAndIsActive(organizationId, active);
        } else {
            persons = personRepository.findByOrganization_Id(organizationId);
        }

        return persons.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PersonResponseDTO findById(UUID organizationId, UUID personId) {
        Person person = getPersonOrThrow(organizationId, personId);
        return toResponse(person);
    }

    public PersonResponseDTO update(UUID organizationId, UUID personId, PersonUpdateRequestDTO request) {
        Person person = getPersonOrThrow(organizationId, personId);

        validateUniqueFieldsForUpdate(organizationId, personId, request.getRut(), request.getEmail());

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = getDepartmentOrThrow(organizationId, request.getDepartmentId());
        }

        person.setDepartment(department);
        person.setFirstName(request.getFirstName());
        person.setLastName(request.getLastName());
        person.setFullName(buildFullName(request.getFirstName(), request.getLastName()));
        person.setRut(request.getRut());
        person.setEmail(request.getEmail());
        person.setPhone(request.getPhone());
        person.setPosition(request.getPosition());

        Person updated = personRepository.save(person);

        return toResponse(updated);
    }

    public PersonResponseDTO updateStatus(
            UUID organizationId,
            UUID personId,
            PersonStatusUpdateRequestDTO request
    ) {
        Person person = getPersonOrThrow(organizationId, personId);

        person.setIsActive(request.getIsActive());

        Person updated = personRepository.save(person);

        return toResponse(updated);
    }

    private Organization getOrganizationOrThrow(UUID organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Organización no encontrada"
                ));
    }

    private Department getDepartmentOrThrow(UUID organizationId, UUID departmentId) {
        return departmentRepository.findByIdAndOrganization_Id(departmentId, organizationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Departamento no encontrado"
                ));
    }

    private Person getPersonOrThrow(UUID organizationId, UUID personId) {
        return personRepository.findByIdAndOrganization_Id(personId, organizationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Persona no encontrada"
                ));
    }

    private void validateUniqueFieldsForCreate(UUID organizationId, String rut, String email) {
        if (rut != null && !rut.isBlank() && personRepository.existsByOrganization_IdAndRut(organizationId, rut)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya existe una persona con ese RUT en la organización"
            );
        }

        if (email != null && !email.isBlank() && personRepository.existsByOrganization_IdAndEmail(organizationId, email)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya existe una persona con ese correo en la organización"
            );
        }
    }

    private void validateUniqueFieldsForUpdate(UUID organizationId, UUID personId, String rut, String email) {
        if (rut != null && !rut.isBlank()
                && personRepository.existsByOrganization_IdAndRutAndIdNot(organizationId, rut, personId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya existe otra persona con ese RUT en la organización"
            );
        }

        if (email != null && !email.isBlank()
                && personRepository.existsByOrganization_IdAndEmailAndIdNot(organizationId, email, personId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya existe otra persona con ese correo en la organización"
            );
        }
    }

    private String buildFullName(String firstName, String lastName) {
        return (firstName.trim() + " " + lastName.trim()).trim();
    }

    private PersonResponseDTO toResponse(Person person) {
        UUID departmentId = person.getDepartment() != null ? person.getDepartment().getId() : null;
        String departmentName = person.getDepartment() != null ? person.getDepartment().getName() : null;

        return new PersonResponseDTO(
                person.getId(),
                person.getOrganization().getId(),
                departmentId,
                departmentName,
                person.getFirstName(),
                person.getLastName(),
                person.getFullName(),
                person.getRut(),
                person.getEmail(),
                person.getPhone(),
                person.getPosition(),
                person.getIsActive(),
                person.getCreatedAt(),
                person.getUpdatedAt()
        );
    }
}
