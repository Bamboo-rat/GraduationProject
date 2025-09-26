package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_username", columnList = "username"),
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_phone", columnList = "phoneNumber"),
    @Index(name = "idx_user_keycloak", columnList = "keycloakId"),
    @Index(name = "idx_user_active", columnList = "active"),
    @Index(name = "idx_user_created", columnList = "createdAt"),
    @Index(name = "idx_user_active_created", columnList = "active, createdAt")
})
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class User {

    @Id
    @UuidGenerator
    private String userId;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false, updatable = false)
    private String keycloakId;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true)
    private String phoneNumber;

    private String fullName;
    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return userId != null && Objects.equals(userId, user.userId);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}