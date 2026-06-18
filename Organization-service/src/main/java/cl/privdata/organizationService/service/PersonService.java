package cl.privdata.organizationService.service;

import java.util.List;
import java.util.UUID;

import cl.privdata.organizationService.dto.request.PersonRectificationRequestDTO;
import cl.privdata.organizationService.enums.DataStatus;
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
import cl.privdata.organizationService.model.ProcessingRestriction;
import cl.privdata.organizationService.repository.DepartmentRepository;
import cl.privdata.organizationService.repository.OrganizationRepository;
import cl.privdata.organizationService.repository.PersonRepository;
import cl.privdata.organizationService.repository.ProcessingRestrictionRepository;


@Service
@Transactional
public class PersonService {

    private final PersonRepository personRepository;
    private final OrganizationRepository organizationRepository;
    private final DepartmentRepository departmentRepository;
    private final ProcessingRestrictionRepository processingRestrictionRepository;


    public PersonService(
            PersonRepository personRepository,
            OrganizationRepository organizationRepository,
            DepartmentRepository departmentRepository,
            ProcessingRestrictionRepository processingRestrictionRepository
    ) {
        this.personRepository = personRepository;
        this.organizationRepository = organizationRepository;
        this.departmentRepository = departmentRepository;
        this.processingRestrictionRepository = processingRestrictionRepository;
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
        person.setBlocked(false);
        person.setAnonymized(false);
        person.setDeletionRequest(false);
        person.setDataStatus(DataStatus.ACTIVE);

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
                person.getUpdatedAt(),
                person.getBlocked(),
                person.getAnonymized(),
                person.getDeletionRequest(),
                person.getDataStatus()
        );
    }

    ///Metodos para derecho ARCO (Cancelación)
    public void blockDataSubject(UUID organizationId, UUID personId){

        Person person = getPersonOrThrow(organizationId,personId);

        if (person.getDataStatus() == DataStatus.BLOCKED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No se puede bloquear la persona porque actualmente se encuentra en estado BLOCKED"
            );
        }

        if (person.getDataStatus() == DataStatus.ANONYMIZED){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No se puede bloquear la persona porque actualmente se encuentra en estado ANONYMIZED"
            );
        }

        person.setBlocked(true);
        person.setDataStatus(DataStatus.BLOCKED);
        personRepository.save(person);
    }

    public void deleteDataSubject(UUID organizationId, UUID personId){

        Person person = getPersonOrThrow(organizationId,personId);

        if (person.getDataStatus() == DataStatus.ANONYMIZED){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No se puede solicitar la eliminación de una persona anonimizada"
            );
        }

        person.setDeletionRequest(true);
        person.setIsActive(false);
        person.setDataStatus(DataStatus.DELETION_REQUESTED);
        personRepository.save(person);

    }

    public void anonymizeDataSubject(UUID organizationId, UUID personId){

        Person person = getPersonOrThrow(organizationId,personId);

        if (person.getDataStatus() == DataStatus.ANONYMIZED){
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La persona ya se encuentra anonimizada"
            );
        }
        UUID personUuid = person.getId();

        person.setFirstName("ANONYMIZED");
        person.setLastName("ANONYMIZED");
        person.setFullName("ANONYMIZED USER");
        person.setRut(null);
        person.setEmail("anon-" + personUuid + "@privdata.local");
        person.setPhone(null);
        person.setPosition(null);
        person.setDepartment(null);

        person.setBlocked(true);
        person.setAnonymized(true);
        person.setDeletionRequest(false);
        person.setIsActive(false);
        person.setDataStatus(DataStatus.ANONYMIZED);

        personRepository.save(person);
    }

    ///metodos relacionados con rectificacion
    public void rectifyDataSubject(UUID organizationId,
                                   UUID personId,
                                   PersonRectificationRequestDTO requestDTO) {

        Person person = getPersonOrThrow(organizationId, personId);

        if (person.getDataStatus() == DataStatus.ANONYMIZED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La persona ya se encuentra anonimizada"
            );
        }

        validateUniqueFieldsForUpdate(
                organizationId,
                personId,
                requestDTO.getRut(),
                requestDTO.getEmail()
        );

        boolean firstNameChanged = false;
        boolean lastNameChanged = false;

        if (requestDTO.getFirstName() != null &&
                !requestDTO.getFirstName().isBlank()) {

            person.setFirstName(requestDTO.getFirstName());
            firstNameChanged = true;
        }

        if (requestDTO.getLastName() != null &&
                !requestDTO.getLastName().isBlank()) {

            person.setLastName(requestDTO.getLastName());
            lastNameChanged = true;
        }

        if (firstNameChanged || lastNameChanged) {

            person.setFullName(
                    buildFullName(
                            person.getFirstName(),
                            person.getLastName()
                    )
            );
        }

        if (requestDTO.getEmail() != null &&
                !requestDTO.getEmail().isBlank()) {

            person.setEmail(requestDTO.getEmail());
        }

        if (requestDTO.getPhone() != null &&
                !requestDTO.getPhone().isBlank()) {

            person.setPhone(requestDTO.getPhone());
        }

        if (requestDTO.getPosition() != null &&
                !requestDTO.getPosition().isBlank()) {

            person.setPosition(requestDTO.getPosition());
        }

        if (requestDTO.getRut() != null &&
                !requestDTO.getRut().isBlank()) {

            person.setRut(requestDTO.getRut());
        }

        personRepository.save(person);
    }

    ///Metodo de oposicion
    public void restrictProcessing(
            UUID organizationId,
            UUID personId,
            UUID treatmentActivityId,
            String purpose
    ) {

        Person person = getPersonOrThrow(
                organizationId,
                personId
        );

        if (person.getDataStatus() == DataStatus.ANONYMIZED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No se puede restringir el tratamiento de una persona anonimizada"
            );
        }

        if (person.getDataStatus() == DataStatus.DELETION_REQUESTED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No se puede restringir el tratamiento de una persona en proceso de supresión"
            );
        }

        if (treatmentActivityId != null) {
            // Restricción acotada a una finalidad/actividad de tratamiento: cada oposición
            // aprobada se registra por separado, así el titular puede oponerse a varias
            // finalidades de forma independiente (Art. 19 Ley 21.719).
            boolean yaRestringida = processingRestrictionRepository
                    .existsByPerson_IdAndTreatmentActivityId(personId, treatmentActivityId);

            if (yaRestringida) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Ya existe una restricción de tratamiento aplicada para esta finalidad"
                );
            }

            processingRestrictionRepository.save(
                    ProcessingRestriction.builder()
                            .organizationId(organizationId)
                            .person(person)
                            .treatmentActivityId(treatmentActivityId)
                            .purpose(purpose)
                            .build()
            );
        } else if (person.getDataStatus() == DataStatus.PROCESSING_RESTRICTED) {
            // Solicitudes sin finalidad asociada (legado): no hay forma de distinguir
            // finalidades, así que se mantiene el resguardo global anterior.
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La persona ya tiene una oposición aplicada"
            );
        }

        person.setBlocked(true);

        person.setDataStatus(
                DataStatus.PROCESSING_RESTRICTED
        );

        personRepository.save(person);
    }


}
