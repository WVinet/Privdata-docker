package cl.privdata.complianceService.DTO.response;

import cl.privdata.complianceService.model.enums.MecanismoTransferencia;
import cl.privdata.complianceService.model.enums.TerceroTipo;

import java.time.LocalDateTime;
import java.util.UUID;

public class TerceroResponseDTO {

    private UUID id;
    private UUID organizationId;
    private String nombre;
    private TerceroTipo tipo;
    private String pais;
    private String finalidadUso;
    private String linkContrato;
    private MecanismoTransferencia mecanismoTransferencia;
    private boolean activo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getOrganizationId() { return organizationId; }
    public void setOrganizationId(UUID organizationId) { this.organizationId = organizationId; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public TerceroTipo getTipo() { return tipo; }
    public void setTipo(TerceroTipo tipo) { this.tipo = tipo; }

    public String getPais() { return pais; }
    public void setPais(String pais) { this.pais = pais; }

    public String getFinalidadUso() { return finalidadUso; }
    public void setFinalidadUso(String finalidadUso) { this.finalidadUso = finalidadUso; }

    public String getLinkContrato() { return linkContrato; }
    public void setLinkContrato(String linkContrato) { this.linkContrato = linkContrato; }

    public MecanismoTransferencia getMecanismoTransferencia() { return mecanismoTransferencia; }
    public void setMecanismoTransferencia(MecanismoTransferencia mecanismoTransferencia) { this.mecanismoTransferencia = mecanismoTransferencia; }

    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
