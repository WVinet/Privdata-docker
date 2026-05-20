package com.privdata.authservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "role_permissions", uniqueConstraints = {
                @UniqueConstraint(columnNames = {"role_id", "permission_id"})})
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RolePermissions {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "active", nullable = false)
    private boolean isActive;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    //relaciones
    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne
    @JoinColumn(name = "permission_id", nullable = false)
    private Permission permission;

}
