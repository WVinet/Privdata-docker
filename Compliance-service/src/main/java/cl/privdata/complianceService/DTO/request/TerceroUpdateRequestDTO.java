package cl.privdata.complianceService.DTO.request;

import cl.privdata.complianceService.model.enums.MecanismoTransferencia;
import cl.privdata.complianceService.model.enums.TerceroTipo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class TerceroUpdateRequestDTO {

    @NotBlank
    private String nombre;

    @NotNull
    private TerceroTipo tipo;

    @NotBlank
    private String pais;

    private String finalidadUso;
    private String linkContrato;
    private MecanismoTransferencia mecanismoTransferencia;
    private boolean activo = true;

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
}
