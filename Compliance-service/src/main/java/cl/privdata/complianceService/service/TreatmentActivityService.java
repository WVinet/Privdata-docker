package cl.privdata.complianceService.service;

import cl.privdata.complianceService.DTO.request.TreatmentActivityCreateRequestDTO;
import cl.privdata.complianceService.DTO.request.TreatmentActivityUpdateRequestDTO;
import cl.privdata.complianceService.DTO.response.DataCategoryResponseDTO;
import cl.privdata.complianceService.DTO.response.TerceroResponseDTO;
import cl.privdata.complianceService.DTO.response.TreatmentActivityResponseDTO;
import cl.privdata.complianceService.model.DataCategory;
import cl.privdata.complianceService.model.Tercero;
import cl.privdata.complianceService.model.TreatmentActivity;
import cl.privdata.complianceService.model.TreatmentActivityDataCategory;
import cl.privdata.complianceService.model.TreatmentActivityTercero;
import cl.privdata.complianceService.model.enums.TreatmentActivityStatus;
import cl.privdata.complianceService.repository.DataCategoryRepository;
import cl.privdata.complianceService.repository.TerceroRepository;
import cl.privdata.complianceService.repository.TreatmentActivityDataCategoryRepository;
import cl.privdata.complianceService.repository.TreatmentActivityRepository;
import cl.privdata.complianceService.repository.TreatmentActivityTerceroRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TreatmentActivityService {

    private final TreatmentActivityRepository activityRepository;
    private final TreatmentActivityDataCategoryRepository activityCategoryRepository;
    private final DataCategoryRepository dataCategoryRepository;
    private final TreatmentActivityTerceroRepository activityTerceroRepository;
    private final TerceroRepository terceroRepository;
    private final TerceroService terceroService;

    public TreatmentActivityService(
            TreatmentActivityRepository activityRepository,
            TreatmentActivityDataCategoryRepository activityCategoryRepository,
            DataCategoryRepository dataCategoryRepository,
            TreatmentActivityTerceroRepository activityTerceroRepository,
            TerceroRepository terceroRepository,
            TerceroService terceroService
    ) {
        this.activityRepository = activityRepository;
        this.activityCategoryRepository = activityCategoryRepository;
        this.dataCategoryRepository = dataCategoryRepository;
        this.activityTerceroRepository = activityTerceroRepository;
        this.terceroRepository = terceroRepository;
        this.terceroService = terceroService;
    }

    public List<TreatmentActivityResponseDTO> getByOrganization(UUID organizationId, TreatmentActivityStatus status) {
        List<TreatmentActivity> activities = status != null
                ? activityRepository.findByOrganizationIdAndStatus(organizationId, status)
                : activityRepository.findByOrganizationId(organizationId);

        List<TreatmentActivityResponseDTO> result = new ArrayList<>();
        for (TreatmentActivity a : activities) {
            result.add(toResponse(a));
        }
        return result;
    }

    public TreatmentActivityResponseDTO getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public TreatmentActivityResponseDTO create(TreatmentActivityCreateRequestDTO request) {
        TreatmentActivity activity = new TreatmentActivity();
        activity.setOrganizationId(request.getOrganizationId());
        activity.setName(request.getName());
        activity.setDescription(request.getDescription());
        activity.setPurpose(request.getPurpose());
        activity.setLegalBasis(request.getLegalBasis());
        activity.setDataSubjectCategories(request.getDataSubjectCategories());
        activity.setRetentionPeriodDays(request.getRetentionPeriodDays());
        activity.setThirdPartyRecipients(request.getThirdPartyRecipients());
        activity.setDataSystems(request.getDataSystems());
        activity.setSecurityMeasures(request.getSecurityMeasures());
        activity.setHasAutomatedDecisions(request.isHasAutomatedDecisions());
        activity.setProfilingDescription(request.getProfilingDescription());
        activity.setStatus(TreatmentActivityStatus.ACTIVE);

        TreatmentActivity saved = activityRepository.save(activity);
        saveCategories(saved.getId(), request.getDataCategoryIds());
        saveTerceros(saved.getId(), request.getTerceroIds());

        // auto-compute internationalTransfer from terceros
        boolean hasInternational = hasInternationalTercero(saved.getId());
        saved.setInternationalTransfer(hasInternational);
        activityRepository.save(saved);

        return toResponse(saved);
    }

    @Transactional
    public TreatmentActivityResponseDTO update(UUID id, TreatmentActivityUpdateRequestDTO request) {
        TreatmentActivity activity = findOrThrow(id);

        activity.setName(request.getName());
        activity.setDescription(request.getDescription());
        activity.setPurpose(request.getPurpose());
        activity.setLegalBasis(request.getLegalBasis());
        activity.setDataSubjectCategories(request.getDataSubjectCategories());
        activity.setRetentionPeriodDays(request.getRetentionPeriodDays());
        activity.setThirdPartyRecipients(request.getThirdPartyRecipients());
        activity.setDataSystems(request.getDataSystems());
        activity.setSecurityMeasures(request.getSecurityMeasures());
        activity.setHasAutomatedDecisions(request.isHasAutomatedDecisions());
        activity.setProfilingDescription(request.getProfilingDescription());
        activity.setStatus(request.getStatus());

        TreatmentActivity saved = activityRepository.save(activity);

        activityCategoryRepository.deleteByTreatmentActivityId(id);
        saveCategories(saved.getId(), request.getDataCategoryIds());

        activityTerceroRepository.deleteByTreatmentActivityId(id);
        saveTerceros(saved.getId(), request.getTerceroIds());

        boolean hasInternational = hasInternationalTercero(saved.getId());
        saved.setInternationalTransfer(hasInternational);
        activityRepository.save(saved);

        return toResponse(saved);
    }

    private void saveCategories(UUID activityId, List<UUID> categoryIds) {
        if (categoryIds == null) return;
        for (UUID categoryId : categoryIds) {
            TreatmentActivityDataCategory link = new TreatmentActivityDataCategory();
            link.setTreatmentActivityId(activityId);
            link.setDataCategoryId(categoryId);
            activityCategoryRepository.save(link);
        }
    }

    private void saveTerceros(UUID activityId, List<UUID> terceroIds) {
        if (terceroIds == null) return;
        for (UUID terceroId : terceroIds) {
            TreatmentActivityTercero link = new TreatmentActivityTercero();
            link.setTreatmentActivityId(activityId);
            link.setTerceroId(terceroId);
            activityTerceroRepository.save(link);
        }
    }

    private boolean hasInternationalTercero(UUID activityId) {
        for (TreatmentActivityTercero link : activityTerceroRepository.findByTreatmentActivityId(activityId)) {
            var opt = terceroRepository.findById(link.getTerceroId());
            if (opt.isPresent() && !"Chile".equalsIgnoreCase(opt.get().getPais())) {
                return true;
            }
        }
        return false;
    }

    private TreatmentActivity findOrThrow(UUID id) {
        return activityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Actividad de tratamiento no encontrada."));
    }

    private TreatmentActivityResponseDTO toResponse(TreatmentActivity activity) {
        List<TreatmentActivityDataCategory> catLinks = activityCategoryRepository.findByTreatmentActivityId(activity.getId());
        List<DataCategoryResponseDTO> categories = new ArrayList<>();
        boolean hasSensitive = false;

        for (TreatmentActivityDataCategory link : catLinks) {
            dataCategoryRepository.findById(link.getDataCategoryId()).ifPresent(cat -> {
                categories.add(toCategoryResponse(cat));
            });
        }

        for (DataCategoryResponseDTO cat : categories) {
            if (cat.isSensitive()) {
                hasSensitive = true;
                break;
            }
        }

        List<TreatmentActivityTercero> terceroLinks = activityTerceroRepository.findByTreatmentActivityId(activity.getId());
        List<TerceroResponseDTO> terceros = new ArrayList<>();
        for (TreatmentActivityTercero link : terceroLinks) {
            terceroRepository.findById(link.getTerceroId())
                    .map(terceroService::toResponse)
                    .ifPresent(terceros::add);
        }

        TreatmentActivityResponseDTO dto = new TreatmentActivityResponseDTO();
        dto.setId(activity.getId());
        dto.setOrganizationId(activity.getOrganizationId());
        dto.setName(activity.getName());
        dto.setDescription(activity.getDescription());
        dto.setPurpose(activity.getPurpose());
        dto.setLegalBasis(activity.getLegalBasis());
        dto.setDataSubjectCategories(activity.getDataSubjectCategories());
        dto.setRetentionPeriodDays(activity.getRetentionPeriodDays());
        dto.setThirdPartyRecipients(activity.getThirdPartyRecipients());
        dto.setInternationalTransfer(activity.isInternationalTransfer());
        dto.setDataSystems(activity.getDataSystems());
        dto.setSecurityMeasures(activity.getSecurityMeasures());
        dto.setHasAutomatedDecisions(activity.isHasAutomatedDecisions());
        dto.setProfilingDescription(activity.getProfilingDescription());
        dto.setStatus(activity.getStatus());
        dto.setContainsSensitiveData(hasSensitive);
        dto.setDataCategories(categories);
        dto.setTerceros(terceros);
        dto.setCreatedAt(activity.getCreatedAt());
        dto.setUpdatedAt(activity.getUpdatedAt());

        return dto;
    }

    private DataCategoryResponseDTO toCategoryResponse(DataCategory cat) {
        DataCategoryResponseDTO dto = new DataCategoryResponseDTO();
        dto.setId(cat.getId());
        dto.setName(cat.getName());
        dto.setDescription(cat.getDescription());
        dto.setSensitive(cat.isSensitive());
        dto.setActive(cat.isActive());
        return dto;
    }
}
