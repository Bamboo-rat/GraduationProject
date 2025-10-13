package com.example.backend.controller;

import com.example.backend.dto.request.AdminUpdateRequest;
import com.example.backend.dto.response.AdminResponse;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.service.AuthService;
import com.example.backend.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final AuthService authService;

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    @Operation(summary = "Get current admin profile", 
               description = "Get detailed profile information of the authenticated admin")
    public ResponseEntity<ApiResponse<AdminResponse>> getCurrentAdmin(Authentication authentication) {
        log.info("GET /api/admins/me - Getting current admin profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        AdminResponse response = authService.getAdminInfo(keycloakId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('admin')")
    @Operation(summary = "Get admin by ID", 
               description = "Get detailed admin information by user ID (super admin only)")
    public ResponseEntity<ApiResponse<AdminResponse>> getAdminById(@PathVariable String userId) {
        log.info("GET /api/admins/{} - Getting admin by ID", userId);

        // TODO: Implement service method to get by userId
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    @Operation(summary = "Update admin profile", 
               description = "Update current admin's profile information")
    public ResponseEntity<ApiResponse<AdminResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody AdminUpdateRequest request) {
        log.info("PUT /api/admins/me - Updating admin profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        // TODO: Implement service method to update admin profile
        AdminResponse response = authService.getAdminInfo(keycloakId);

        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('admin')")
    @Operation(summary = "Get all admins/staff", 
               description = "Get list of all admins and staff with pagination (super admin only)")
    public ResponseEntity<ApiResponse<Object>> getAllAdmins(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        log.info("GET /api/admins - Getting all admins (page: {}, size: {}, role: {}, status: {})", 
                page, size, role, status);

        // TODO: Implement pagination and filtering
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @PatchMapping("/{userId}/approve")
    @PreAuthorize("hasRole('admin')")
    @Operation(summary = "Approve admin/staff", 
               description = "Approve pending admin/staff application (super admin only)")
    public ResponseEntity<ApiResponse<AdminResponse>> approveAdmin(@PathVariable String userId) {
        log.info("PATCH /api/admins/{}/approve - Approving admin/staff", userId);

        // TODO: Implement approval logic
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @PatchMapping("/{userId}/suspend")
    @PreAuthorize("hasRole('admin')")
    @Operation(summary = "Suspend admin/staff", 
               description = "Suspend admin/staff account (super admin only)")
    public ResponseEntity<ApiResponse<Void>> suspendAdmin(
            @PathVariable String userId,
            @RequestParam(required = false) String reason) {
        log.info("PATCH /api/admins/{}/suspend - Suspending admin/staff. Reason: {}", userId, reason);

        // TODO: Implement suspension logic
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @PatchMapping("/{userId}/activate")
    @PreAuthorize("hasRole('admin')")
    @Operation(summary = "Activate admin/staff", 
               description = "Activate suspended admin/staff account (super admin only)")
    public ResponseEntity<ApiResponse<AdminResponse>> activateAdmin(@PathVariable String userId) {
        log.info("PATCH /api/admins/{}/activate - Activating admin/staff", userId);

        // TODO: Implement activation logic
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
