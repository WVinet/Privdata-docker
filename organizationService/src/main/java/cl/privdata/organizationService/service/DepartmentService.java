package cl.privdata.organizationService.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.privdata.organizationService.dto.request.DepartmentCreateRequestDTO;
import cl.privdata.organizationService.dto.request.DepartmentStatusUpdateRequestDTO;
import cl.privdata.organizationService.dto.request.DepartmentUpdateRequestDTO;
import cl.privdata.organizationService.dto.response.DepartmentResponseDTO;
import cl.privdata.organizationService.model.Department;
import cl.privdata.organizationService.model.Organization;
import cl.privdata.organizationService.repository.DepartmentRepository;
import cl.privdata.organizationService.repository.OrganizationRepository;

@Service
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final OrganizationRepository organizationRepository;

    public DepartmentService(
            DepartmentRepository departmentRepository,
            OrganizationRepository organizationRepository
    ) {
        this.departmentRepository = departmentRepository;
        this.organizationRepository = organizationRepository;
    }

    public DepartmentResponseDTO create(UUID organizationId, DepartmentCreateRequestDTO request) {
        Organization organization = getOrganizationOrThrow(organizationId);

        if (departmentRepository.existsByOrganization_IdAndName(organizationId, request.getName())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya existe un departamento con ese nombre en la organización"
            );
        }

        Department department = new Department();
        department.setOrganization(organization);
        department.setName(request.getName());
        department.setDescription(request.getDescription());
        department.setIsActive(true);

        Department saved = departmentRepository.save(department);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponseDTO> findAllByOrganization(UUID organizationId, Boolean active) {
        getOrganizationOrThrow(organizationId);

        List<Department> departments;

        if (active == null) {
            departments = departmentRepository.findByOrganization_Id(organizationId);
        } else {
            departments = departmentRepository.findByOrganization_IdAndIsActive(organizationId, active);
        }

        return departments.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DepartmentResponseDTO findById(UUID organizationId, UUID departmentId) {
        Department department = getDepartmentOrThrow(organizationId, departmentId);
        return toResponse(department);
    }

    public DepartmentResponseDTO update(
            UUID organizationId,
            UUID departmentId,
            DepartmentUpdateRequestDTO request
    ) {
        Department department = getDepartmentOrThrow(organizationId, departmentId);

        if (departmentRepository.existsByOrganization_IdAndNameAndIdNot(
                organizationId,
                request.getName(),
                departmentId
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya existe otro departamento con ese nombre en la organización"
            );
        }

        department.setName(request.getName());
        department.setDescription(request.getDescription());

        Department updated = departmentRepository.save(department);

        return toResponse(updated);
    }

    public DepartmentResponseDTO updateStatus(
            UUID organizationId,
            UUID departmentId,
            DepartmentStatusUpdateRequestDTO request
    ) {
        Department department = getDepartmentOrThrow(organizationId, departmentId);

        department.setIsActive(request.getIsActive());

        Department updated = departmentRepository.save(department);

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

    private DepartmentResponseDTO toResponse(Department department) {
        return new DepartmentResponseDTO(
                department.getId(),
                department.getOrganization().getId(),
                department.getName(),
                department.getDescription(),
                department.getIsActive(),
                department.getCreatedAt()
        );
    }
}