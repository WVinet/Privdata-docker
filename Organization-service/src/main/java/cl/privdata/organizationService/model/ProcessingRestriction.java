package cl.privdata.organizationService.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Registra una restricción de tratamiento (Art. 19 Ley 21.719) aplicada a una persona
 * para una finalidad/actividad de tratamiento específica. Permite que un titular se oponga
 * a varias finalidades de forma independiente, en lugar de un único flag global por persona.
 */
@Entity
@Table(
        name = "processing_restrictions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"person_id", "treatment_activity_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessingRestriction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false, columnDefinition = "UUID")
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Column(name = "treatment_activity_id", nullable = false)
    private UUID treatmentActivityId;

    @Column(name = "purpose", columnDefinition = "TEXT")
    private String purpose;

    @CreationTimestamp
    @Column(name = "restricted_at", nullable = false, updatable = false)
    private LocalDateTime restrictedAt;
}
