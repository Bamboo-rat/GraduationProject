package com.example.backend.controller;

import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.response.ApiResponse;
import com.example.backend.dto.response.LoginResponse;
import com.example.backend.dto.response.UserInfoResponse;
import com.example.backend.service.AuthService;
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
    // ===== CUSTOMER LOGIN (Phone + OTP) - No authentication required =====

    @PostMapping("/login/customer/step1")
    @Operation(summary = "Customer login - Step 1", description = "Send OTP to customer's phone for login (console log in dev mode)")
    public ResponseEntity<ApiResponse<String>> loginCustomerStep1(@RequestParam String phoneNumber) {
        log.info("POST /api/auth/login/customer/step1 - Sending OTP to phone: {}", phoneNumber);
        customerService.sendLoginOtp(phoneNumber);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to phone (check console log in dev mode)"));
    }

    @PostMapping("/login/customer/step2")
    @Operation(summary = "Customer login - Step 2", description = "Verify OTP and login, return JWT token")
    public ResponseEntity<ApiResponse<LoginResponse>> loginCustomerStep2(@RequestParam String phoneNumber, @RequestParam String otp) {
        log.info("POST /api/auth/login/customer/step2 - Verifying OTP for phone: {}", phoneNumber);
        LoginResponse response = customerService.verifyLoginOtpAndLogin(phoneNumber, otp);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    private final AuthService authService;
    private final com.example.backend.service.CustomerService customerService;
    private final com.example.backend.service.SupplierService supplierService;

    // ===== CUSTOMER REGISTRATION (Phone + OTP) - No authentication required =====
    
    @PostMapping("/register/customer/step1")
    @Operation(summary = "Customer registration - Step 1", 
               description = "Register with phone number only. OTP will be sent via SMS (console log in dev mode).")
    public ResponseEntity<ApiResponse<com.example.backend.dto.response.RegisterResponse>> registerCustomerStep1(
            @Valid @RequestBody com.example.backend.dto.request.CustomerRequest request) {
        log.info("POST /api/auth/register/customer/step1 - Registering customer with phone: {}", request.getPhoneNumber());
        com.example.backend.dto.response.RegisterResponse response = customerService.registerStep1(request);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("OTP sent successfully", response));
    }

    @PostMapping("/register/customer/step2")
    @Operation(summary = "Customer registration - Step 2", 
               description = "Verify OTP sent to phone number. Account will be activated after successful verification.")
    public ResponseEntity<ApiResponse<com.example.backend.dto.response.RegisterResponse>> verifyCustomerOtpStep2(
            @Valid @RequestBody com.example.backend.dto.request.CustomerVerifyOtpRequest request) {
        log.info("POST /api/auth/register/customer/step2 - Verifying OTP for phone: {}", request.getPhoneNumber());
        com.example.backend.dto.response.RegisterResponse response = customerService.verifyOtpStep2(request.getPhoneNumber(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.success("Account activated successfully", response));
    }

    @PostMapping("/register/customer/resend-otp")
    @Operation(summary = "Resend OTP for customer registration", 
               description = "Resend OTP to phone number for pending verification account (console log in dev mode)")
    public ResponseEntity<ApiResponse<String>> resendCustomerOtp(@RequestParam String phoneNumber) {
        log.info("POST /api/auth/register/customer/resend-otp - Resending OTP to phone: {}", phoneNumber);
        String message = customerService.resendOtp(phoneNumber);
        return ResponseEntity.ok(ApiResponse.success(message));
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

        // Extract keycloakId and JWT token
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String keycloakId = jwt.getSubject();

        // Pass JWT to service to extract roles
        UserInfoResponse response = authService.getUserInfo(keycloakId, jwt);
        return ResponseEntity.ok(ApiResponse.success("User info retrieved successfully", response));
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
}
