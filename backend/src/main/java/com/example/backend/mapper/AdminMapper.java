package com.example.backend.mapper;

import com.example.backend.dto.response.AdminResponse;
import com.example.backend.entity.Admin;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for Admin entity to DTO conversion
 */
@Component
public class AdminMapper {

    /**
     * Convert Admin entity to AdminResponse DTO
     */
    public AdminResponse toResponse(Admin admin) {
        if (admin == null) {
            return null;
        }

        return AdminResponse.builder()
                .userId(admin.getUserId())
                .keycloakId(admin.getKeycloakId())
                .username(admin.getUsername())
                .email(admin.getEmail())
                .phoneNumber(admin.getPhoneNumber())
                .fullName(admin.getFullName())
                .active(admin.isActive())
                .role(admin.getRole() != null ? admin.getRole().name() : null)
                .status(admin.getStatus() != null ? admin.getStatus().name() : null)
                .lastLoginIp(admin.getLastLoginIp())
                .createdAt(admin.getCreatedAt())
                .updatedAt(admin.getUpdatedAt())
                .build();
    }

    /**
     * Convert list of Admin entities to list of AdminResponse DTOs
     */
    public List<AdminResponse> toResponseList(List<Admin> admins) {
        if (admins == null) {
            return List.of();
        }
        return admins.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
