package com.example.backend.service;

import com.example.backend.dto.request.AdminRegisterRequest;
import com.example.backend.dto.request.AdminUpdateRequest;
import com.example.backend.dto.response.AdminResponse;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.entity.enums.AdminStatus;
import com.example.backend.entity.enums.Role;
import org.springframework.data.domain.Page;

/**
 * Service for Admin management
 */
public interface AdminService {

    /**
     * Register a new admin/staff
     * @param request Admin registration request
     * @return Registration response
     */
    RegisterResponse registerAdmin(AdminRegisterRequest request);

    /**
     * Get admin information by keycloakId
     * @param keycloakId Keycloak user ID
     * @return Admin response
     */
    AdminResponse getAdminInfo(String keycloakId);

    /**
     * Get admin information by userId
     * @param userId User ID (String UUID)
     * @return Admin response
     */
    AdminResponse getAdminById(String userId);

    /**
     * Update admin profile
     * @param keycloakId Keycloak user ID
     * @param request Update request
     * @return Updated admin response
     */
    AdminResponse updateProfile(String keycloakId, AdminUpdateRequest request);

    /**
     * Update admin status (by super admin)
     * @param userId User ID (String UUID)
     * @param status New status
     * @return Updated admin response
     */
    AdminResponse updateStatus(String userId, AdminStatus status);

    /**
     * Activate/Deactivate admin account
     * @param userId User ID (String UUID)
     * @param active Active status
     * @return Updated admin response
     */
    AdminResponse setActive(String userId, boolean active);

    /**
     * Update admin role (by super admin)
     * @param userId User ID (String UUID)
     * @param role New role
     * @return Updated admin response
     */
    AdminResponse updateRole(String userId, Role role);

    /**
     * Get all admins with pagination and filtering
     * @param page Page number (0-based)
     * @param size Page size
     * @param role Filter by role (optional)
     * @param status Filter by status (optional)
     * @return Page of admin responses
     */
    Page<AdminResponse> getAllAdmins(int page, int size, Role role, AdminStatus status);
}
