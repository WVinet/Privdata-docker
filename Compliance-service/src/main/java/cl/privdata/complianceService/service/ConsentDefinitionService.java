package cl.privdata.complianceService.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import cl.privdata.complianceService.DTO.request.ConsentDefinitionCreateRequestDTO;
import cl.privdata.complianceService.DTO.response.ConsentDefinitionResponseDTO;
import cl.privdata.complianceService.model.ConsentDefinition;
import cl.privdata.complianceService.repository.ConsentDefinitionRepository;

@Service
public class ConsentDefinitionService {

    private final ConsentDefinitionRepository repository;

    public ConsentDefinitionService(ConsentDefinitionRepository repository) {
        this.repository = repository;
    }

    public List<ConsentDefinitionResponseDTO> getByOrganization(UUID organizationId) {
        return repository.findByOrganizationIdAndActiveTrue(organizationId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ConsentDefinitionResponseDTO> getPendingForPerson(UUID organizationId, UUID personId) {
        return repository.findPendingForPerson(organizationId, personId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ConsentDefinitionResponseDTO create(ConsentDefinitionCreateRequestDTO request) {
        ConsentDefinition def = new ConsentDefinition();
        def.setOrganizationId(request.getOrganizationId());
        def.setTitle(request.getTitle());
        def.setDescription(request.getDescription());
        def.setRequired(request.isRequired());
        def.setLegalBasis(request.getLegalBasis());
        def.setActive(true);
        return toResponse(repository.save(def));
    }

    public ConsentDefinitionResponseDTO setActive(UUID id, boolean active) {
        ConsentDefinition def = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Definición de consentimiento no encontrada."));
        def.setActive(active);
        return toResponse(repository.save(def));
    }

    private ConsentDefinitionResponseDTO toResponse(ConsentDefinition def) {
        ConsentDefinitionResponseDTO dto = new ConsentDefinitionResponseDTO();
        dto.setId(def.getId());
        dto.setOrganizationId(def.getOrganizationId());
        dto.setTitle(def.getTitle());
        dto.setDescription(def.getDescription());
        dto.setRequired(def.isRequired());
        dto.setLegalBasis(def.getLegalBasis());
        dto.setActive(def.isActive());
        dto.setCreatedAt(def.getCreatedAt());
        dto.setUpdatedAt(def.getUpdatedAt());
        return dto;
    }
}
