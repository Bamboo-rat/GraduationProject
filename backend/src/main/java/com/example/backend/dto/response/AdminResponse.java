package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Detailed response DTO for Admin information
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminResponse {
    
    // User basic info
    private String userId;
    private String keycloakId;
    private String username;
    private String email;
    private String phoneNumber;
    private String fullName;
    private String gender; // MALE, FEMALE, OTHER
    private String avatarUrl;
    private boolean active;
    
    // Admin specific info
    private String role; // SUPER_ADMIN, ADMIN, MODERATOR, CONTENT_MANAGER
    private String status; // PENDING_APPROVAL, ACTIVE, SUSPENDED, BANNED
    private String lastLoginIp;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
