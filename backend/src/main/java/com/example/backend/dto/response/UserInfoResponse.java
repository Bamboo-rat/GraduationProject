package com.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInfoResponse {
    private String userId;
    private String keycloakId;
    private String username;
    private String email;
    private String phoneNumber;
    private String fullName;
    private boolean active;
    private String userType; // "customer", "supplier", "admin"
    private String status;
    private List<String> roles;
    private LocalDateTime createdAt;

    // Customer specific
    private Integer points;
    private String tier;
    private String avatarUrl;

    // Supplier specific
    private String businessName;
    private String logoUrl;

    // Admin specific
    private String adminRole;
}
