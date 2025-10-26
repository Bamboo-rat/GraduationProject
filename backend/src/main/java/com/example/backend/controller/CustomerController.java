package com.example.backend.controller;

import com.example.backend.dto.request.CustomerUpdateRequest;
import com.example.backend.dto.request.CustomerRequest;
import com.example.backend.dto.request.CustomerVerifyOtpRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.CustomerResponse;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.service.CustomerService;
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
 * Controller for customer-specific operations (requires authentication)
 * Customer registration has been moved to AuthController: POST /api/auth/register/customer/*
 */
@Slf4j
@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Tag(name = "Customer", description = "Customer profile and management endpoints (authenticated)")
@SecurityRequirement(name = "Bearer Authentication")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerController {

    private final CustomerService customerService;

    // ===== Profile Management Endpoints (Authentication required) =====

    @GetMapping("/me")
    @Operation(summary = "Get current customer profile", 
               description = "Get detailed profile information of the authenticated customer")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCurrentCustomer(Authentication authentication) {
        log.info("GET /api/customers/me - Getting current customer profile");
        
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);
        CustomerResponse response = customerService.getCustomerInfo(keycloakId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF','SUPPLIER')")
    @Operation(summary = "Get customer by ID", 
               description = "Get detailed customer information by user ID (admin only)")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable String userId) {
        log.info("GET /api/customers/{} - Getting customer by ID", userId);

        // TODO: Implement service method to get by userId
        // For now, this is a placeholder
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @PutMapping("/me")
    @Operation(summary = "Update customer profile", 
               description = "Update current customer's profile information")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody CustomerUpdateRequest request) {
        log.info("PUT /api/customers/me - Updating customer profile");
        
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = JwtUtils.extractKeycloakId(jwt);
        CustomerResponse response = customerService.updateProfile(keycloakId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    // Avatar update is handled via updateProfile() method
    // Upload avatar first via FileStorageController, then include avatarUrl in CustomerProfileUpdateRequest

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MODERATOR', 'STAFF')")
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
