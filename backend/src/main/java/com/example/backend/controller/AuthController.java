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
import org.springframework.security.access.prepost.PreAuthorize;
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
                .body(ApiResponse.success("Customer registered successfully", response));
    }

    @PostMapping("/register/supplier")
    @Operation(summary = "Register a new supplier", description = "Register a new supplier account with PENDING_APPROVAL status")
    public ResponseEntity<ApiResponse<RegisterResponse>> registerSupplier(@Valid @RequestBody SupplierRegisterRequest request) {
        log.info("POST /api/auth/register/supplier - Registering supplier: {}", request.getUsername());
        RegisterResponse response = authService.registerSupplier(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Supplier registered successfully", response));
    }

    @PostMapping("/register/admin")
//    @PreAuthorize("hasRole('SUPER_ADMIN')") // ONLY SUPER_ADMIN can create admin accounts
    @Operation(summary = "Register a new admin/staff", 
               description = "Register a new admin/staff account with PENDING_APPROVAL status. Only accessible by SUPER_ADMIN.")
    public ResponseEntity<ApiResponse<RegisterResponse>> registerAdmin(@Valid @RequestBody AdminRegisterRequest request) {
        log.info("POST /api/auth/register/admin - Registering admin: {}", request.getUsername());
        RegisterResponse response = authService.registerAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Admin/staff registered successfully", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate user and get access token")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("POST /api/auth/login - Login attempt for user: {}", request.getUsername());
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user info", description = "Get information about the currently authenticated user")
    public ResponseEntity<ApiResponse<UserInfoResponse>> getCurrentUser(Authentication authentication) {
        log.info("GET /api/auth/me - Getting current user info");

        // Extract keycloakId and JWT token
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = jwt.getSubject();

        // Pass JWT to service to extract roles
        UserInfoResponse response = authService.getUserInfo(keycloakId, jwt);
        return ResponseEntity.ok(ApiResponse.success("User info retrieved successfully", response));
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verify customer email", description = "Verify customer email address using token sent to their email")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@RequestParam("token") String token) {
        log.info("GET /api/auth/verify-email - Verifying email with token");
        String message = authService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully", message));
    }

    @PostMapping("/resend-verification-email")
    @Operation(summary = "Resend verification email", description = "Resend verification email to customer who hasn't verified their email")
    public ResponseEntity<ApiResponse<String>> resendVerificationEmail(@RequestParam("email") String email) {
        log.info("POST /api/auth/resend-verification-email - Resending verification email to: {}", email);
        String message = authService.resendVerificationEmail(email);
        return ResponseEntity.ok(ApiResponse.success("Verification email resent", message));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Get a new access token using refresh token")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(@RequestParam("refreshToken") String refreshToken) {
        log.info("POST /api/auth/refresh - Refreshing token");
        LoginResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout", description = "Logout user and revoke refresh token")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestParam("refreshToken") String refreshToken) {
        log.info("POST /api/auth/logout - Logging out user");
        authService.logout(refreshToken);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }
}
