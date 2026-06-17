package cl.duoc.agenciaService.service;

import cl.duoc.agenciaService.client.ArcoServiceClient;
import cl.duoc.agenciaService.dto.request.AgencyClaimCreateRequest;
import cl.duoc.agenciaService.dto.response.AgencyClaimResponseDTO;
import cl.duoc.agenciaService.enums.AgencyClaimStatus;
import cl.duoc.agenciaService.exception.AgencyClaimNotFoundException;
import cl.duoc.agenciaService.model.AgencyClaim;
import cl.duoc.agenciaService.repository.AgencyClaimRepository;
import cl.duoc.agenciaService.security.AgencyPrincipal;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgencyClaimService {

    private final AgencyClaimRepository agencyClaimRepository;
    private final ArcoServiceClient arcoServiceClient;
    private final EmailService emailService;

    @Transactional
    public AgencyClaimResponseDTO crear(AgencyClaimCreateRequest dto) {
        AgencyClaim claim = new AgencyClaim();
        claim.setArcoRequestId(dto.getArcoRequestId());
        claim.setOrganizationId(dto.getOrganizationId());
        claim.setDataSubjectId(dto.getDataSubjectId());
        claim.setDataSubjectName(dto.getDataSubjectName());
        claim.setDataSubjectEmail(dto.getDataSubjectEmail());
        claim.setDataSubjectRut(dto.getDataSubjectRut());
        claim.setRequestType(dto.getRequestType());
        claim.setOriginalResolutionSummary(dto.getOriginalResolutionSummary());
        claim.setOriginalDenialLegalBasis(dto.getOriginalDenialLegalBasis());
        claim.setOriginalResolvedByEmail(dto.getOriginalResolvedByEmail());
        claim.setClaimReason(dto.getClaimReason());
        claim.setStatus(AgencyClaimStatus.PENDIENTE);
        claim.setSubmittedAt(dto.getSubmittedAt() != null ? dto.getSubmittedAt() : LocalDateTime.now());

        return AgencyClaimResponseDTO.fromEntity(agencyClaimRepository.save(claim));
    }

    public Page<AgencyClaimResponseDTO> listar(AgencyClaimStatus status, Pageable pageable) {
        Page<AgencyClaim> page = status != null
                ? agencyClaimRepository.findByStatus(status, pageable)
                : agencyClaimRepository.findAll(pageable);
        return page.map(AgencyClaimResponseDTO::fromEntity);
    }

    public AgencyClaimResponseDTO buscarPorId(UUID id) {
        return AgencyClaimResponseDTO.fromEntity(buscarEntidad(id));
    }

    public Object panelSolicitudes(UUID organizationId) {
        return arcoServiceClient.listarSolicitudes(organizationId);
    }

    @Transactional
    public AgencyClaimResponseDTO responder(UUID id, String respuesta) {
        AgencyClaim claim = buscarEntidad(id);

        if (claim.getStatus() == AgencyClaimStatus.RESPONDIDO) {
            throw new IllegalArgumentException("Este reclamo ya fue respondido.");
        }

        AgencyPrincipal principal = (AgencyPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        claim.setAgencyResponse(respuesta);
        claim.setStatus(AgencyClaimStatus.RESPONDIDO);
        claim.setRespondedAt(LocalDateTime.now());
        claim.setRespondedByEmail(principal.email());
        if (principal.userId() != null) {
            claim.setRespondedByUserId(UUID.fromString(principal.userId()));
        }

        AgencyClaim saved = agencyClaimRepository.save(claim);

        try {
            emailService.sendClaimResponseEmail(saved.getDataSubjectEmail(), saved.getArcoRequestId(), respuesta);
        } catch (Exception ex) {
            log.warn("No se pudo enviar el correo de respuesta del reclamo {}: {}", id, ex.getMessage());
        }

        try {
            arcoServiceClient.notificarRespuesta(saved.getArcoRequestId(), saved.getId(), respuesta, saved.getRespondedAt());
        } catch (Exception ex) {
            log.warn("No se pudo notificar la respuesta a Arco-service para el reclamo {}: {}", id, ex.getMessage());
        }

        return AgencyClaimResponseDTO.fromEntity(saved);
    }

    private AgencyClaim buscarEntidad(UUID id) {
        return agencyClaimRepository.findById(id)
                .orElseThrow(() -> new AgencyClaimNotFoundException(id));
    }
}
