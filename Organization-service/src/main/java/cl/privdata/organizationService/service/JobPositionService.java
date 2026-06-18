package cl.privdata.organizationService.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import cl.privdata.organizationService.dto.request.JobPositionCreateRequestDTO;
import cl.privdata.organizationService.dto.request.JobPositionStatusUpdateRequestDTO;
import cl.privdata.organizationService.dto.request.JobPositionUpdateRequestDTO;
import cl.privdata.organizationService.dto.response.JobPositionResponseDTO;
import cl.privdata.organizationService.model.JobPosition;
import cl.privdata.organizationService.model.Organization;
import cl.privdata.organizationService.repository.JobPositionRepository;
import cl.privdata.organizationService.repository.OrganizationRepository;

@Service
@Transactional
public class JobPositionService {

    private final JobPositionRepository jobPositionRepository;
    private final OrganizationRepository organizationRepository;

    public JobPositionService(
            JobPositionRepository jobPositionRepository,
            OrganizationRepository organizationRepository
    ) {
        this.jobPositionRepository = jobPositionRepository;
        this.organizationRepository = organizationRepository;
    }

    public JobPositionResponseDTO create(UUID organizationId, JobPositionCreateRequestDTO request) {
        Organization organization = getOrganizationOrThrow(organizationId);

        if (jobPositionRepository.existsByOrganization_IdAndName(organizationId, request.getName())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya existe un cargo con ese nombre en la organización"
            );
        }

        JobPosition jobPosition = new JobPosition();
        jobPosition.setOrganization(organization);
        jobPosition.setName(request.getName());
        jobPosition.setDescription(request.getDescription());
        jobPosition.setIsActive(true);

        JobPosition saved = jobPositionRepository.save(jobPosition);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<JobPositionResponseDTO> findAllByOrganization(UUID organizationId, Boolean active) {
        getOrganizationOrThrow(organizationId);

        List<JobPosition> jobPositions;

        if (active == null) {
            jobPositions = jobPositionRepository.findByOrganization_Id(organizationId);
        } else {
            jobPositions = jobPositionRepository.findByOrganization_IdAndIsActive(organizationId, active);
        }

        return jobPositions.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public JobPositionResponseDTO findById(UUID organizationId, UUID jobPositionId) {
        JobPosition jobPosition = getJobPositionOrThrow(organizationId, jobPositionId);
        return toResponse(jobPosition);
    }

    public JobPositionResponseDTO update(
            UUID organizationId,
            UUID jobPositionId,
            JobPositionUpdateRequestDTO request
    ) {
        JobPosition jobPosition = getJobPositionOrThrow(organizationId, jobPositionId);

        if (jobPositionRepository.existsByOrganization_IdAndNameAndIdNot(
                organizationId,
                request.getName(),
                jobPositionId
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya existe otro cargo con ese nombre en la organización"
            );
        }

        jobPosition.setName(request.getName());
        jobPosition.setDescription(request.getDescription());

        JobPosition updated = jobPositionRepository.save(jobPosition);

        return toResponse(updated);
    }

    public JobPositionResponseDTO updateStatus(
            UUID organizationId,
            UUID jobPositionId,
            JobPositionStatusUpdateRequestDTO request
    ) {
        JobPosition jobPosition = getJobPositionOrThrow(organizationId, jobPositionId);

        jobPosition.setIsActive(request.getIsActive());

        JobPosition updated = jobPositionRepository.save(jobPosition);

        return toResponse(updated);
    }

    private Organization getOrganizationOrThrow(UUID organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Organización no encontrada"
                ));
    }

    private JobPosition getJobPositionOrThrow(UUID organizationId, UUID jobPositionId) {
        return jobPositionRepository.findByIdAndOrganization_Id(jobPositionId, organizationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Cargo no encontrado"
                ));
    }

    private JobPositionResponseDTO toResponse(JobPosition jobPosition) {
        return new JobPositionResponseDTO(
                jobPosition.getId(),
                jobPosition.getOrganization().getId(),
                jobPosition.getName(),
                jobPosition.getDescription(),
                jobPosition.getIsActive(),
                jobPosition.getCreatedAt()
        );
    }
}
