package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Base response DTO for user information (used for authentication & general user info)
 * For detailed user info, use specific responses:
 * - CustomerResponse for customer details
 * - SupplierResponse for supplier details  
 * - AdminResponse for admin details
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInfoResponse {
    // Basic user info (common for all user types)
    private String userId;
    private String keycloakId;
    private String username;
    private String email;
    private String phoneNumber;
    private String fullName;
    private String avatarUrl; // Avatar URL for all user types
    private boolean active;
    private String userType; // "CUSTOMER", "SUPPLIER", "ADMIN"
    private String status; // Status enum as string
    private List<String> roles; // Keycloak roles
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
