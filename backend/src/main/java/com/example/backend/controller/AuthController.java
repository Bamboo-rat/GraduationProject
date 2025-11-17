package com.example.backend.controller;

import com.example.backend.dto.request.ChangePasswordRequest;
import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.PhoneAuthStep1Request;
import com.example.backend.dto.request.PhoneAuthStep2Request;
import com.example.backend.dto.request.SocialLoginRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.LoginResponse;
import com.example.backend.dto.response.PhoneAuthStep1Response;
import com.example.backend.dto.response.UserInfoResponse;
import com.example.backend.service.AuthService;
import com.example.backend.service.CustomerService;
import com.example.backend.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Common authentication endpoints (login, logout, registration)")
public class AuthController {
    private final AuthService authService;
    private final CustomerService customerService;
    private final SupplierService supplierService;

    // ===== PHONE AUTHENTICATION (Login/Register) =====
    
    @PostMapping("/customer/phone-auth/step1")
    @Operation(
        summary = "Phone authentication - Step 1: Send OTP",
        description = "Unified login/register for customers. If phone exists: login flow. If phone doesn't exist: auto-create account. OTP will be sent via SMS."
    )
    public ResponseEntity<ApiResponse<PhoneAuthStep1Response>> phoneAuthStep1(
            @Valid @RequestBody PhoneAuthStep1Request request) {
        log.info("POST /api/auth/customer/phone-auth/step1 - Phone: {}", request.getPhoneNumber());
        com.example.backend.dto.response.PhoneAuthStep1Response response = customerService.phoneAuthStep1(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent successfully", response));
    }
    
    @PostMapping("/customer/phone-auth/step2")
    @Operation(
        summary = "Phone authentication - Step 2: Verify OTP & Login",
        description = "Verify OTP and authenticate. Returns JWT tokens for both new and existing customers."
    )
    public ResponseEntity<ApiResponse<LoginResponse>> phoneAuthStep2(
            @Valid @RequestBody PhoneAuthStep2Request request) {
        log.info("POST /api/auth/customer/phone-auth/step2 - Phone: {}", request.getPhoneNumber());
        LoginResponse response = customerService.phoneAuthStep2(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    // ===== SOCIAL LOGIN (Google/Facebook via Keycloak) =====

    @PostMapping("/customer/login/google")
    @Operation(
        summary = "Google OAuth2 Login",
        description = "Exchange Google OAuth2 authorization code for JWT tokens. Frontend should redirect user to Google OAuth, then send the authorization code here."
    )
    public ResponseEntity<ApiResponse<LoginResponse>> loginWithGoogle(
            @Valid @RequestBody SocialLoginRequest request) {
        log.info("POST /api/auth/customer/login/google - Google OAuth login attempt");
        LoginResponse response = authService.loginWithGoogle(request.getCode(), request.getRedirectUri());
        return ResponseEntity.ok(ApiResponse.success("Google login successful", response));
    }

    @PostMapping("/customer/login/facebook")
    @Operation(
        summary = "Facebook OAuth2 Login",
        description = "Exchange Facebook OAuth2 authorization code for JWT tokens. Frontend should redirect user to Facebook OAuth, then send the authorization code here."
    )
    public ResponseEntity<ApiResponse<LoginResponse>> loginWithFacebook(
            @Valid @RequestBody SocialLoginRequest request) {
        log.info("POST /api/auth/customer/login/facebook - Facebook OAuth login attempt");
        LoginResponse response = authService.loginWithFacebook(request.getCode(), request.getRedirectUri());
        return ResponseEntity.ok(ApiResponse.success("Facebook login successful", response));
    }

    // ===== COMMON LOGIN =====

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

        try {
            // Extract keycloakId and JWT token
            Jwt jwt = (Jwt) authentication.getPrincipal();
            String keycloakId = jwt.getSubject();
            
            log.info("JWT subject (keycloakId): {}", keycloakId);
            log.info("JWT issuer: {}", jwt.getIssuer());
            log.info("JWT claims: {}", jwt.getClaims().keySet());

            // Pass JWT to service to extract roles
            UserInfoResponse response = authService.getUserInfo(keycloakId, jwt);
            return ResponseEntity.ok(ApiResponse.success("User info retrieved successfully", response));
        } catch (Exception e) {
            log.error("Error getting current user info: {}", e.getMessage(), e);
            throw e;
        }
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

    // ===== SUPPLIER REGISTRATION (4-step flow) - No authentication required =====

    @PostMapping("/register/supplier/step1")
    @Operation(summary = "Supplier registration - Step 1",
               description = "Register supplier account with basic info (username, email, fullName, phone). OTP will be sent to email.")
    public ResponseEntity<ApiResponse<com.example.backend.dto.response.RegisterResponse>> registerSupplierStep1(
            @Valid @RequestBody com.example.backend.dto.request.SupplierRegisterStep1Request request) {
        log.info("POST /api/auth/register/supplier/step1 - Registering supplier: {}", request.getUsername());
        com.example.backend.dto.response.RegisterResponse response = supplierService.registerStep1(request);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful. Please check your email for OTP verification.", response));
    }

    @PostMapping("/register/supplier/step2")
    @Operation(summary = "Supplier registration - Step 2",
               description = "Verify email with OTP code sent in step 1")
    public ResponseEntity<ApiResponse<String>> verifySupplierEmailStep2(
            @Valid @RequestBody com.example.backend.dto.request.SupplierRegisterStep2Request request) {
        log.info("POST /api/auth/register/supplier/step2 - Request received: supplierId={}, email={}, otp={}",
                request.getSupplierId(), request.getEmail(), request.getOtp());
        String message = supplierService.verifyEmailStep2(request.getSupplierId(), request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/register/supplier/resend-otp")
    @Operation(summary = "Resend OTP for supplier email verification",
               description = "Resend OTP to supplier email if not received or expired")
    public ResponseEntity<ApiResponse<String>> resendSupplierOtp(@RequestParam String supplierId) {
        log.info("POST /api/auth/register/supplier/resend-otp - Resending OTP for supplier: {}", supplierId);
        String message = supplierService.resendOtp(supplierId);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/register/supplier/step3")
    @Operation(summary = "Supplier registration - Step 3",
               description = "Upload required business documents (business license and food safety certificate are required, avatar is optional). Upload files via /api/storage first, then submit URLs here.")
    public ResponseEntity<ApiResponse<String>> uploadSupplierDocumentsStep3(
            @Valid @RequestBody com.example.backend.dto.request.SupplierRegisterStep3Request request) {
        log.info("POST /api/auth/register/supplier/step3 - Uploading documents for supplier: {}", request.getSupplierId());
        String message = supplierService.uploadDocumentsStep3(request.getSupplierId(), request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/register/supplier/step4")
    @Operation(summary = "Supplier registration - Step 4",
               description = "Submit business info and first store details. After this step, account will be pending admin approval.")
    public ResponseEntity<ApiResponse<String>> submitSupplierStoreInfoStep4(
            @Valid @RequestBody com.example.backend.dto.request.SupplierRegisterStep4Request request) {
        log.info("POST /api/auth/register/supplier/step4 - Submitting store info for supplier: {}", request.getSupplierId());
        String message = supplierService.submitStoreInfoStep4(request.getSupplierId(), request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    // ===== PASSWORD RESET (3-Step OTP-Based Flow) - No authentication required =====

    @PostMapping("/forgot-password")
    @Operation(summary = "Password Reset - Step 1: Request OTP",
               description = "Request password reset by sending a 6-digit OTP to email. Works for both Admin and Supplier accounts. OTP is valid for 10 minutes.")
    public ResponseEntity<ApiResponse<com.example.backend.dto.response.ResetPasswordResponse>> forgotPassword(
            @Valid @RequestBody com.example.backend.dto.request.ForgotPasswordRequest request) {
        log.info("POST /api/auth/forgot-password - Password reset OTP requested for email: {}, userType: {}",
                request.getEmail(), request.getUserType());
        com.example.backend.dto.response.ResetPasswordResponse response =
                authService.requestPasswordReset(request.getEmail(), request.getUserType());
        return ResponseEntity.ok(ApiResponse.success("OTP sent to your email. Please check your inbox.", response));
    }

    @PostMapping("/verify-reset-otp")
    @Operation(summary = "Password Reset - Step 2: Verify OTP and get reset token",
               description = "Verify the OTP sent to your email. If valid, a temporary reset token will be returned (valid for 10 minutes).")
    public ResponseEntity<ApiResponse<com.example.backend.dto.response.ResetPasswordResponse>> verifyResetOtp(
            @Valid @RequestBody com.example.backend.dto.request.VerifyResetOtpRequest request) {
        log.info("POST /api/auth/verify-reset-otp - Verifying OTP for email: {}", request.getEmail());
        com.example.backend.dto.response.ResetPasswordResponse response =
                authService.verifyResetOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully. Use the reset token to update your password.", response));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Password Reset - Step 3: Reset password with token",
               description = "Reset password using the temporary reset token from Step 2. The new password must match the confirmation password and meet security requirements (min 8 characters, at least one uppercase, one lowercase, one number, and one special character).")
    public ResponseEntity<ApiResponse<com.example.backend.dto.response.ResetPasswordResponse>> resetPassword(
            @Valid @RequestBody com.example.backend.dto.request.ResetPasswordRequest request) {
        log.info("POST /api/auth/reset-password - Resetting password with token");
        com.example.backend.dto.response.ResetPasswordResponse response =
                authService.resetPassword(request.getToken(), request.getNewPassword(), request.getConfirmPassword());
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully. You can now login with your new password.", response));
    }

    // ===== AUTHENTICATED USER OPERATIONS =====

    @PostMapping("/change-password")
    @Operation(summary = "Change password for authenticated user",
               description = "Change password for currently authenticated user. Requires authentication. User must provide current password and new password (min 8 characters).")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody com.example.backend.dto.request.ChangePasswordRequest request,
            Authentication authentication) {
        log.info("POST /api/auth/change-password - Changing password for authenticated user");
        
        // Extract keycloakId from JWT
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = jwt.getSubject();
        
        authService.changePassword(keycloakId, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công"));
    }
}
