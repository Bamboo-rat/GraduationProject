package com.example.backend.controller;

import com.example.backend.dto.request.AdminRegisterRequest;
import com.example.backend.dto.request.CustomerRegisterRequest;
import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.SupplierRegisterRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.LoginResponse;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.dto.response.UserInfoResponse;
import com.example.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication endpoints for registration and login")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/customer")
    @Operation(summary = "Register a new customer", description = "Register a new customer account with PENDING_VERIFICATION status")
    public ResponseEntity<ApiResponse<RegisterResponse>> registerCustomer(@Valid @RequestBody CustomerRegisterRequest request) {
        log.info("POST /api/auth/register/customer - Registering customer: {}", request.getUsername());
        RegisterResponse response = authService.registerCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Customer registered successfully"));
    }

    @PostMapping("/register/supplier")
    @Operation(summary = "Register a new supplier", description = "Register a new supplier account with PENDING_APPROVAL status")
    public ResponseEntity<ApiResponse<RegisterResponse>> registerSupplier(@Valid @RequestBody SupplierRegisterRequest request) {
        log.info("POST /api/auth/register/supplier - Registering supplier: {}", request.getUsername());
        RegisterResponse response = authService.registerSupplier(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Supplier registered successfully"));
    }

    @PostMapping("/register/admin")
    @Operation(summary = "Register a new admin/staff", description = "Register a new admin/staff account with PENDING_APPROVAL status")
    public ResponseEntity<ApiResponse<RegisterResponse>> registerAdmin(@Valid @RequestBody AdminRegisterRequest request) {
        log.info("POST /api/auth/register/admin - Registering admin: {}", request.getUsername());
        RegisterResponse response = authService.registerAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Admin/staff registered successfully"));
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate user and get access token")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /api/auth/login - Login attempt for user: {}", request.getUsername());
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user info", description = "Get information about the currently authenticated user")
    public ResponseEntity<ApiResponse<UserInfoResponse>> getCurrentUser(Authentication authentication) {
        log.info("GET /api/auth/me - Getting current user info");

        // Extract keycloakId from JWT token
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = jwt.getSubject();

        UserInfoResponse response = authService.getUserInfo(keycloakId);
        return ResponseEntity.ok(ApiResponse.success(response, "User info retrieved successfully"));
    }
}
