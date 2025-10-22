package com.example.backend.controller;

import com.example.backend.dto.request.*;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.dto.response.SupplierResponse;
import com.example.backend.service.SupplierService;
import com.example.backend.utils.JwtUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for supplier-specific operations (requires authentication)
 * Supplier registration has been moved to AuthController: POST /api/auth/register/supplier/*
 */
@Slf4j
@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@Tag(name = "Supplier", description = "Supplier profile and management endpoints (authenticated)")
@SecurityRequirement(name = "Bearer Authentication")
@PreAuthorize("hasAnyRole('SUPPLIER', 'SUPER_ADMIN', 'MODERATOR', 'STAFF')")
public class SupplierController {

    private final SupplierService supplierService;

    // ===== PROFILE MANAGEMENT ENDPOINTS (Authentication required) =====

    @GetMapping("/me")
    @Operation(summary = "Get current supplier profile", 
               description = "Get detailed profile information of the authenticated supplier")
    public ResponseEntity<ApiResponse<SupplierResponse>> getCurrentSupplier(Authentication authentication) {
        log.info("GET /api/suppliers/me - Getting current supplier profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        SupplierResponse response = supplierService.getSupplierInfo(keycloakId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get supplier by ID", 
               description = "Get detailed supplier information by user ID (admin only)")
    public ResponseEntity<ApiResponse<SupplierResponse>> getSupplierById(@PathVariable String userId) {
        log.info("GET /api/suppliers/{} - Getting supplier by ID", userId);

        // TODO: Implement service method to get by userId
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @PutMapping("/me")
    @Operation(summary = "Update supplier profile", 
               description = "Update current supplier's profile information")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody SupplierProfileUpdateRequest request) {
        log.info("PUT /api/suppliers/me - Updating supplier profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        SupplierResponse response = supplierService.updateProfile(keycloakId, request);

        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
    @Operation(summary = "Get all suppliers",
               description = "Get list of all suppliers with pagination, search, and filtering (admin only)")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<SupplierResponse>>> getAllSuppliers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) com.example.backend.entity.enums.SupplierStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        log.info("GET /api/suppliers - Getting all suppliers (page: {}, size: {}, status: {}, search: {})",
                page, size, status, search);

        org.springframework.data.domain.Page<SupplierResponse> suppliers =
                supplierService.getAllSuppliers(page, size, status, search, sortBy, sortDirection);

        return ResponseEntity.ok(ApiResponse.success(suppliers));
    }

    @PatchMapping("/{userId}/approve")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Approve supplier",
               description = "Approve pending supplier application and send email notification (admin/moderator only)")
    public ResponseEntity<ApiResponse<SupplierResponse>> approveSupplier(
            @PathVariable String userId,
            @RequestParam(required = false) String note) {
        log.info("PATCH /api/suppliers/{}/approve - Approving supplier with note: {}", userId, note);

        SupplierResponse response = supplierService.approveSupplier(userId, note);
        return ResponseEntity.ok(ApiResponse.success("Supplier approved successfully and notification email sent", response));
    }

    @PatchMapping("/{userId}/reject")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR')")
    @Operation(summary = "Reject supplier",
               description = "Reject pending supplier application and send email notification (admin/moderator only)")
    public ResponseEntity<ApiResponse<SupplierResponse>> rejectSupplier(
            @PathVariable String userId,
            @RequestParam(required = false) String reason) {
        log.info("PATCH /api/suppliers/{}/reject - Rejecting supplier. Reason: {}", userId, reason);

        SupplierResponse response = supplierService.rejectSupplier(userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Supplier rejected and notification email sent", response));
    }
}
