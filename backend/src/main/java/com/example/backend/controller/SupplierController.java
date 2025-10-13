package com.example.backend.controller;

import com.example.backend.dto.request.SupplierUpdateRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.SupplierResponse;
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
 * Controller for supplier-specific operations
 */
@Slf4j
@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@Tag(name = "Supplier", description = "Supplier profile and management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class SupplierController {

    private final AuthService authService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('supplier')")
    @Operation(summary = "Get current supplier profile", 
               description = "Get detailed profile information of the authenticated supplier")
    public ResponseEntity<ApiResponse<SupplierResponse>> getCurrentSupplier(Authentication authentication) {
        log.info("GET /api/suppliers/me - Getting current supplier profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        SupplierResponse response = authService.getSupplierInfo(keycloakId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    @Operation(summary = "Get supplier by ID", 
               description = "Get detailed supplier information by user ID (admin only)")
    public ResponseEntity<ApiResponse<SupplierResponse>> getSupplierById(@PathVariable String userId) {
        log.info("GET /api/suppliers/{} - Getting supplier by ID", userId);

        // TODO: Implement service method to get by userId
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('supplier')")
    @Operation(summary = "Update supplier profile", 
               description = "Update current supplier's profile information")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody SupplierUpdateRequest request) {
        log.info("PUT /api/suppliers/me - Updating supplier profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        // TODO: Implement service method to update supplier profile
        SupplierResponse response = authService.getSupplierInfo(keycloakId);

        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @PutMapping("/me/logo")
    @PreAuthorize("hasRole('supplier')")
    @Operation(summary = "Update supplier logo URL", 
               description = "Update logo URL after uploading image via file storage endpoint")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateLogo(
            Authentication authentication,
            @RequestParam String logoUrl) {
        log.info("PUT /api/suppliers/me/logo - Updating supplier logo");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        // TODO: Implement service method to update logo
        SupplierResponse response = authService.getSupplierInfo(keycloakId);

        return ResponseEntity.ok(ApiResponse.success("Logo updated successfully", response));
    }

    @PutMapping("/me/business-license")
    @PreAuthorize("hasRole('supplier')")
    @Operation(summary = "Update business license URL", 
               description = "Update business license URL after uploading file via file storage endpoint")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateBusinessLicense(
            Authentication authentication,
            @RequestParam String businessLicenseUrl) {
        log.info("PUT /api/suppliers/me/business-license - Updating business license");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        // TODO: Implement service method to update business license
        SupplierResponse response = authService.getSupplierInfo(keycloakId);

        return ResponseEntity.ok(ApiResponse.success("Business license updated successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    @Operation(summary = "Get all suppliers", 
               description = "Get list of all suppliers with pagination (admin only)")
    public ResponseEntity<ApiResponse<Object>> getAllSuppliers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        log.info("GET /api/suppliers - Getting all suppliers (page: {}, size: {}, status: {})", 
                page, size, status);

        // TODO: Implement pagination and filtering
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @PatchMapping("/{userId}/approve")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    @Operation(summary = "Approve supplier", 
               description = "Approve pending supplier application (admin only)")
    public ResponseEntity<ApiResponse<SupplierResponse>> approveSupplier(@PathVariable String userId) {
        log.info("PATCH /api/suppliers/{}/approve - Approving supplier", userId);

        // TODO: Implement approval logic
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @PatchMapping("/{userId}/reject")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    @Operation(summary = "Reject supplier", 
               description = "Reject pending supplier application (admin only)")
    public ResponseEntity<ApiResponse<Void>> rejectSupplier(
            @PathVariable String userId,
            @RequestParam(required = false) String reason) {
        log.info("PATCH /api/suppliers/{}/reject - Rejecting supplier. Reason: {}", userId, reason);

        // TODO: Implement rejection logic
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
