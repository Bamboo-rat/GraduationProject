package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Detailed response DTO for Customer information
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerResponse {
    
    // User basic info
    private String userId;
    private String keycloakId;
    private String username;
    private String email;
    private String phoneNumber;
    private String fullName;
    private String gender; // MALE, FEMALE, OTHER
    private boolean active;
    
    // Customer specific info
    private int points;
    private int lifetimePoints;
    private int pointsThisYear;
    private String avatarUrl;
    private LocalDate dateOfBirth;
    private String status; // PENDING_VERIFICATION, ACTIVE, SUSPENDED, BANNED
    private String tier; // BRONZE, SILVER, GOLD, PLATINUM
    private LocalDateTime tierUpdatedAt;
    
    // Statistics
    private Integer totalOrders;
    private Integer totalReviews;
    private Integer addressCount;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
