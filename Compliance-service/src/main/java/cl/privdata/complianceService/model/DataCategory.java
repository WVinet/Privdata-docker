package cl.privdata.complianceService.model;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "data_categories")
public class DataCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    private boolean sensitive;

    @Column(nullable = false)
    private boolean active = true;

    public DataCategory() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isSensitive() { return sensitive; }
    public void setSensitive(boolean sensitive) { this.sensitive = sensitive; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
