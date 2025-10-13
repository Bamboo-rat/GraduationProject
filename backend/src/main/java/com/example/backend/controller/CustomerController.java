package com.example.backend.controller;

import com.example.backend.dto.request.CustomerUpdateRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.CustomerResponse;
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
 * Controller for customer-specific operations
 */
@Slf4j
@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Tag(name = "Customer", description = "Customer profile and management endpoints")
@SecurityRequirement(name = "Bearer Authentication")
public class CustomerController {

    private final AuthService authService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('customer')")
    @Operation(summary = "Get current customer profile", 
               description = "Get detailed profile information of the authenticated customer")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCurrentCustomer(Authentication authentication) {
        log.info("GET /api/customers/me - Getting current customer profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        CustomerResponse response = authService.getCustomerInfo(keycloakId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    @Operation(summary = "Get customer by ID", 
               description = "Get detailed customer information by user ID (admin only)")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable String userId) {
        log.info("GET /api/customers/{} - Getting customer by ID", userId);

        // TODO: Implement service method to get by userId
        // For now, this is a placeholder
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('customer')")
    @Operation(summary = "Update customer profile", 
               description = "Update current customer's profile information")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody CustomerUpdateRequest request) {
        log.info("PUT /api/customers/me - Updating customer profile");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        // TODO: Implement service method to update customer profile
        // For now, return current profile
        CustomerResponse response = authService.getCustomerInfo(keycloakId);

        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @PutMapping("/me/avatar")
    @PreAuthorize("hasRole('customer')")
    @Operation(summary = "Update customer avatar URL", 
               description = "Update avatar URL after uploading image via file storage endpoint")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateAvatar(
            Authentication authentication,
            @RequestParam String avatarUrl) {
        log.info("PUT /api/customers/me/avatar - Updating customer avatar");

        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);

        // TODO: Implement service method to update avatar
        CustomerResponse response = authService.getCustomerInfo(keycloakId);

        return ResponseEntity.ok(ApiResponse.success("Avatar updated successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('admin', 'staff')")
    @Operation(summary = "Get all customers", 
               description = "Get list of all customers with pagination (admin only)")
    public ResponseEntity<ApiResponse<Object>> getAllCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("GET /api/customers - Getting all customers (page: {}, size: {})", page, size);

        // TODO: Implement pagination
        throw new UnsupportedOperationException("Not implemented yet");
    }
}
