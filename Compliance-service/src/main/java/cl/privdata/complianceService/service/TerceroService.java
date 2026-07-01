package cl.privdata.complianceService.service;

import cl.privdata.complianceService.DTO.request.TerceroCreateRequestDTO;
import cl.privdata.complianceService.DTO.request.TerceroUpdateRequestDTO;
import cl.privdata.complianceService.DTO.response.TerceroResponseDTO;
import cl.privdata.complianceService.model.Tercero;
import cl.privdata.complianceService.repository.TerceroRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TerceroService {

    private final TerceroRepository terceroRepository;

    public TerceroService(TerceroRepository terceroRepository) {
        this.terceroRepository = terceroRepository;
    }

    public List<TerceroResponseDTO> getByOrganization(UUID organizationId, Boolean onlyActive) {
        List<Tercero> terceros = Boolean.TRUE.equals(onlyActive)
                ? terceroRepository.findByOrganizationIdAndActivo(organizationId, true)
                : terceroRepository.findByOrganizationId(organizationId);
        return terceros.stream().map(this::toResponse).collect(Collectors.toList());
    }

    public TerceroResponseDTO getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public TerceroResponseDTO create(TerceroCreateRequestDTO request) {
        Tercero tercero = new Tercero();
        tercero.setOrganizationId(request.getOrganizationId());
        tercero.setNombre(request.getNombre());
        tercero.setTipo(request.getTipo());
        tercero.setPais(request.getPais());
        tercero.setFinalidadUso(request.getFinalidadUso());
        tercero.setLinkContrato(request.getLinkContrato());
        tercero.setMecanismoTransferencia(request.getMecanismoTransferencia());
        tercero.setActivo(true);
        return toResponse(terceroRepository.save(tercero));
    }

    @Transactional
    public TerceroResponseDTO update(UUID id, TerceroUpdateRequestDTO request) {
        Tercero tercero = findOrThrow(id);
        tercero.setNombre(request.getNombre());
        tercero.setTipo(request.getTipo());
        tercero.setPais(request.getPais());
        tercero.setFinalidadUso(request.getFinalidadUso());
        tercero.setLinkContrato(request.getLinkContrato());
        tercero.setMecanismoTransferencia(request.getMecanismoTransferencia());
        tercero.setActivo(request.isActivo());
        return toResponse(terceroRepository.save(tercero));
    }

    @Transactional
    public void delete(UUID id) {
        findOrThrow(id);
        terceroRepository.deleteById(id);
    }

    private Tercero findOrThrow(UUID id) {
        return terceroRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tercero no encontrado."));
    }

    public TerceroResponseDTO toResponse(Tercero t) {
        TerceroResponseDTO dto = new TerceroResponseDTO();
        dto.setId(t.getId());
        dto.setOrganizationId(t.getOrganizationId());
        dto.setNombre(t.getNombre());
        dto.setTipo(t.getTipo());
        dto.setPais(t.getPais());
        dto.setFinalidadUso(t.getFinalidadUso());
        dto.setLinkContrato(t.getLinkContrato());
        dto.setMecanismoTransferencia(t.getMecanismoTransferencia());
        dto.setActivo(t.isActivo());
        dto.setCreatedAt(t.getCreatedAt());
        dto.setUpdatedAt(t.getUpdatedAt());
        return dto;
    }
}
