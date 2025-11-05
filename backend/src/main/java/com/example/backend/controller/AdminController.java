package com.example.backend.controller;

import com.example.backend.dto.request.AdminRegisterRequest;
import com.example.backend.dto.request.AdminUpdateRequest;
import com.example.backend.dto.response.AdminResponse;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.entity.enums.AdminStatus;
import com.example.backend.entity.enums.Role;
import com.example.backend.service.AdminService;
import com.example.backend.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for admin-specific operations
 */
@Slf4j
@RestController
@RequestMapping("/api/admins")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin profile and management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminController {

    private final AdminService adminService;

    // ===== REGISTRATION ENDPOINT (Super Admin only) =====

    @PostMapping("/register")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Register new admin/staff",
               description = "Register a new admin or staff member (Super Admin only). The account will be immediately active.")
    public ResponseEntity<ApiResponse<RegisterResponse>> registerAdmin(@Valid @RequestBody AdminRegisterRequest request) {
        log.info("POST /api/admins/register - Registering new admin/staff: {} with role: {}",
                request.getUsername(), request.getRole());
        RegisterResponse response = adminService.registerAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Admin/Staff registered successfully and activated.", response));
    }

    // ===== PROFILE MANAGEMENT ENDPOINTS =====

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get current admin profile", 
               description = "Get detailed profile information of the authenticated admin")
    public ResponseEntity<ApiResponse<AdminResponse>> getCurrentAdmin(Authentication authentication) {
        log.info("GET /api/admins/me - Getting current admin profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        AdminResponse response = adminService.getAdminInfo(keycloakId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get admin by ID",
               description = "Get detailed admin information by user ID (super admin only)")
    public ResponseEntity<ApiResponse<AdminResponse>> getAdminById(@PathVariable String userId) {
        log.info("GET /api/admins/{} - Getting admin by ID", userId);

        AdminResponse response = adminService.getAdminById(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Update admin profile", 
               description = "Update current admin's profile information")
    public ResponseEntity<ApiResponse<AdminResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody AdminUpdateRequest request) {
        log.info("PUT /api/admins/me - Updating admin profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        AdminResponse response = adminService.updateProfile(keycloakId, request);

        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Get all admins/staff", 
               description = "Get list of all admins and staff with pagination (super admin only)")
    public ResponseEntity<ApiResponse<Page<AdminResponse>>> getAllAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        log.info("GET /api/admins - Getting all admins (page: {}, size: {}, role: {}, status: {})", 
                page, size, role, status);

        // Parse role and status if provided
        Role roleEnum = null;
        if (role != null && !role.isBlank()) {
            try {
                roleEnum = Role.valueOf(role);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid role filter: {}", role);
            }
        }

        AdminStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try {
                statusEnum = AdminStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status filter: {}", status);
            }
        }

        Page<AdminResponse> admins = adminService.getAllAdmins(page, size, roleEnum, statusEnum);
        return ResponseEntity.ok(ApiResponse.success("Admins retrieved successfully", admins));
    }

    @PatchMapping("/{userId}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Activate admin/staff to ACTIVE status",
               description = "Set admin/staff status to ACTIVE (super admin only). Note: New registrations are already active by default.")
    public ResponseEntity<ApiResponse<AdminResponse>> approveAdmin(@PathVariable String userId) {
        log.info("PATCH /api/admins/{}/approve - Setting admin/staff to ACTIVE status", userId);

        AdminResponse response = adminService.updateStatus(userId, AdminStatus.ACTIVE);
        return ResponseEntity.ok(ApiResponse.success("Admin/Staff set to ACTIVE successfully", response));
    }

    @PatchMapping("/{userId}/suspend")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Suspend admin/staff",
               description = "Suspend admin/staff account (super admin only)")
    public ResponseEntity<ApiResponse<AdminResponse>> suspendAdmin(
            @PathVariable String userId,
            @RequestParam(required = false) String reason) {
        log.info("PATCH /api/admins/{}/suspend - Suspending admin/staff. Reason: {}", userId, reason);

        // TODO: Store suspension reason in a separate field or audit log if needed
        AdminResponse response = adminService.updateStatus(userId, AdminStatus.INACTIVE);
        return ResponseEntity.ok(ApiResponse.success("Admin/Staff suspended successfully", response));
    }

    @PatchMapping("/{userId}/activate")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Activate admin/staff",
               description = "Activate suspended admin/staff account (super admin only)")
    public ResponseEntity<ApiResponse<AdminResponse>> activateAdmin(@PathVariable String userId) {
        log.info("PATCH /api/admins/{}/activate - Activating admin/staff", userId);

        AdminResponse response = adminService.setActive(userId, true);
        return ResponseEntity.ok(ApiResponse.success("Admin/Staff activated successfully", response));
    }

    @PatchMapping("/{userId}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update admin/staff role",
               description = "Update admin/staff role (super admin only)")
    public ResponseEntity<ApiResponse<AdminResponse>> updateAdminRole(
            @PathVariable String userId,
            @RequestParam String role) {
        log.info("PATCH /api/admins/{}/role - Updating admin/staff role to: {}", userId, role);

        try {
            Role roleEnum = Role.valueOf(role);
            AdminResponse response = adminService.updateRole(userId, roleEnum);
            return ResponseEntity.ok(ApiResponse.success("Admin/Staff role updated successfully", response));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid role: {}", role);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid role. Valid values: ROLE_SUPER_ADMIN, ROLE_MODERATOR, ROLE_STAFF"));
        }
    }
}
