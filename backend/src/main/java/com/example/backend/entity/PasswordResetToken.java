package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @UuidGenerator
    private String resetTokenId;

    @Column(nullable = false, unique = true, length = 255)
    private String token;

    @Column(nullable = false, unique = true, length = 255)
    private String keycloakId; // Store keycloakId instead of direct user reference

    @Column(nullable = false, length = 50)
    private String userType; // "ADMIN" or "SUPPLIER"

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime usedAt;

    @Column(nullable = false)
    private boolean used;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        used = false;
    }

    /**
     * Check if token is expired
     * @return true if current time is after expiry date
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }

    /**
     * Check if token is valid (not used and not expired)
     * @return true if token can be used
     */
    public boolean isValid() {
        return !used && !isExpired();
    }

    /**
     * Mark token as used
     */
    public void markAsUsed() {
        this.used = true;
        this.usedAt = LocalDateTime.now();
    }
}
