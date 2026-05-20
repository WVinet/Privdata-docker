package cl.privdata.organizationService.service;

import cl.privdata.organizationService.repository.OrganizationSettingsRepository;
import cl.privdata.organizationService.dto.request.OrganizationSettingsCreateRequestDTO;
import cl.privdata.organizationService.dto.request.OrganizationSettingsUpdateRequestDTO;
import cl.privdata.organizationService.dto.response.OrganizationSettingsResponseDTO;
import cl.privdata.organizationService.model.Organization;
import cl.privdata.organizationService.model.OrganizationSettings;
import cl.privdata.organizationService.repository.OrganizationRepository;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class OrganizationSettingsService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationSettingsRepository organizationSettingsRepository;

    public OrganizationSettingsService(
            OrganizationRepository organizationRepository,
            OrganizationSettingsRepository organizationSettingsRepository
    ) {
        this.organizationRepository = organizationRepository;
        this.organizationSettingsRepository = organizationSettingsRepository;
    }

    public OrganizationSettingsResponseDTO create(
            UUID organizationId,
            OrganizationSettingsCreateRequestDTO request
    ) {
        Organization organization = getOrganizationOrThrow(organizationId);

        if (organizationSettingsRepository.existsByOrganizationId(organizationId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La organización ya tiene configuración registrada"
            );
        }

        OrganizationSettings settings = new OrganizationSettings();
        settings.setOrganization(organization);
        settings.setDefaultLanguage(request.getDefaultLanguage());
        settings.setPrivacyEmail(request.getPrivacyEmail());
        settings.setAllowDataExports(request.getAllowDataExports());

        OrganizationSettings saved = organizationSettingsRepository.save(settings);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public OrganizationSettingsResponseDTO findByOrganizationId(UUID organizationId) {
        OrganizationSettings settings = organizationSettingsRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "La organización no tiene configuración registrada"
                ));

        return toResponse(settings);
    }

    public OrganizationSettingsResponseDTO update(
            UUID organizationId,
            OrganizationSettingsUpdateRequestDTO request
    ) {
        OrganizationSettings settings = organizationSettingsRepository.findByOrganizationId(organizationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "La organización no tiene configuración registrada"
                ));

        settings.setDefaultLanguage(request.getDefaultLanguage());
        settings.setPrivacyEmail(request.getPrivacyEmail());
        settings.setAllowDataExports(request.getAllowDataExports());

        OrganizationSettings updated = organizationSettingsRepository.save(settings);

        return toResponse(updated);
    }

    private Organization getOrganizationOrThrow(UUID organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Organización no encontrada"
                ));
    }

    private OrganizationSettingsResponseDTO toResponse(OrganizationSettings settings) {
        return new OrganizationSettingsResponseDTO(
                settings.getId(),
                settings.getOrganization().getId(),
                settings.getDefaultLanguage(),
                settings.getPrivacyEmail(),
                settings.getAllowDataExports(),
                settings.getUpdatedAt()
        );
    }
}
