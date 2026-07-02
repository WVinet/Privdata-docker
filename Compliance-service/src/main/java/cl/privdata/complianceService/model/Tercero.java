package cl.privdata.complianceService.model;

import cl.privdata.complianceService.model.enums.MecanismoTransferencia;
import cl.privdata.complianceService.model.enums.TerceroTipo;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "terceros")
public class Tercero {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TerceroTipo tipo;

    @Column(nullable = false, length = 100)
    private String pais;

    @Column(name = "finalidad_uso", columnDefinition = "TEXT")
    private String finalidadUso;

    @Column(name = "link_contrato", length = 500)
    private String linkContrato;

    @Enumerated(EnumType.STRING)
    @Column(name = "mecanismo_transferencia", length = 40)
    private MecanismoTransferencia mecanismoTransferencia;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

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
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
