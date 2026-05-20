package cl.privdata.organizationService.service;

import cl.privdata.organizationService.dto.request.OrganizationCreateRequestDTO;

import cl.privdata.organizationService.dto.request.OrganizationStatusUpdateRequestDTO;
import cl.privdata.organizationService.dto.request.OrganizationUpdateRequestDTO;
import cl.privdata.organizationService.dto.response.OrganizationResponseDTO;

import cl.privdata.organizationService.model.Organization;
import cl.privdata.organizationService.repository.OrganizationRepository;


import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service

@Transactional
public class OrganizationService {

    private final OrganizationRepository organizationRepository;

    public OrganizationService(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }


    public OrganizationResponseDTO create(OrganizationCreateRequestDTO request) {
        if (organizationRepository.existsByRut(request.getRut())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya existe una organización registrada con ese RUT"
            );
        }

        Organization organization = new Organization();
        organization.setName(request.getName());
        organization.setLegalName(request.getLegalName());
        organization.setRut(request.getRut());
        organization.setBusinessType(request.getBusinessType());
        organization.setEmail(request.getEmail());
        organization.setPhone(request.getPhone());
        organization.setAddress(request.getAddress());
        organization.setIsActive(true);

        Organization saved = organizationRepository.save(organization);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponseDTO> findAll() {
        return organizationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrganizationResponseDTO findById(UUID organizationId) {
        Organization organization = getOrganizationOrThrow(organizationId);
        return toResponse(organization);
    }

    public OrganizationResponseDTO update(UUID organizationId, OrganizationUpdateRequestDTO request) {
        Organization organization = getOrganizationOrThrow(organizationId);

        if (organizationRepository.existsByRutAndIdNot(request.getRut(), organizationId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ya existe otra organización registrada con ese RUT"
            );
        }

        organization.setName(request.getName());
        organization.setLegalName(request.getLegalName());
        organization.setRut(request.getRut());
        organization.setBusinessType(request.getBusinessType());
        organization.setEmail(request.getEmail());
        organization.setPhone(request.getPhone());
        organization.setAddress(request.getAddress());

        Organization updated = organizationRepository.save(organization);
        return toResponse(updated);
    }

    public OrganizationResponseDTO updateStatus(UUID organizationId, OrganizationStatusUpdateRequestDTO request) {
        Organization organization = getOrganizationOrThrow(organizationId);
        organization.setIsActive(request.getIsActive());

        Organization updated = organizationRepository.save(organization);
        return toResponse(updated);
    }

    private Organization getOrganizationOrThrow(UUID organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Organización no encontrada"
                ));
    }

    private OrganizationResponseDTO toResponse(Organization organization) {
        return new OrganizationResponseDTO(
                organization.getId(),
                organization.getName(),
                organization.getLegalName(),
                organization.getRut(),
                organization.getBusinessType(),
                organization.getEmail(),
                organization.getPhone(),
                organization.getAddress(),
                organization.getIsActive(),
                organization.getCreatedAt(),
                organization.getUpdatedAt()
        );
    }
}
