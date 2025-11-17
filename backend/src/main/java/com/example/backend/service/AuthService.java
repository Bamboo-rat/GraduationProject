package com.example.backend.service;

import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.response.*;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Service for common authentication operations
 * Note: Registration is now handled by specific services:
 * - AdminService.registerAdmin()
 * - SupplierService.registerStep1() (4-step flow)
 * - CustomerService.registerCustomer() (to be implemented)
 */
public interface AuthService {

    /**
     * Login user (works for Customer, Supplier, Admin)
     * @param request Login request
     * @return Login response with tokens and user info
     */
    LoginResponse login(LoginRequest request);

    /**
     * Get basic user information (for authentication)
     * @param keycloakId Keycloak user ID
     * @param jwt JWT token to extract roles
     * @return Basic user information
     */
    UserInfoResponse getUserInfo(String keycloakId, Jwt jwt);

    /**
     * Refresh access token using refresh token
     * @param refreshToken Refresh token
     * @return New login response with new tokens
     */
    LoginResponse refreshToken(String refreshToken);

    /**
     * Logout user and revoke tokens
     * @param refreshToken Refresh token to revoke
     */
    void logout(String refreshToken);


    /**
     * Verify OTP and login customer (passwordless)
     * @param phoneNumber Customer phone number
     * @param otp OTP code
     * @return Login response with tokens
     */
    LoginResponse verifyCustomerLoginOtp(String phoneNumber, String otp);

    /**
     * Step 1: Request password reset - Send OTP to email
     * @param email User email (Admin or Supplier)
     * @param userType "ADMIN" or "SUPPLIER"
     * @return Response with success message
     */
    ResetPasswordResponse requestPasswordReset(String email, String userType);

    /**
     * Step 2: Verify OTP and generate temporary reset token
     * @param email User email
     * @param otp OTP code from email
     * @return Response with temporary reset token (valid 10 min)
     */
    ResetPasswordResponse verifyResetOtp(String email, String otp);

    /**
     * Step 3: Reset password using temporary token from Step 2
     * @param resetToken Temporary reset token from verifyResetOtp
     * @param newPassword New password
     * @param confirmPassword Confirm password
     * @return Response with success message
     */
    ResetPasswordResponse resetPassword(String resetToken, String newPassword, String confirmPassword);

    /**
     * Change password for authenticated user
     * @param keycloakId Keycloak user ID from JWT
     * @param currentPassword Current password
     * @param newPassword New password
     */
    void changePassword(String keycloakId, String currentPassword, String newPassword);

    /**
     * Social login via Google (Keycloak Identity Provider)
     * @param code Authorization code from Google OAuth
     * @param redirectUri Redirect URI used in the authorization request
     * @return Login response with tokens and user info
     */
    LoginResponse loginWithGoogle(String code, String redirectUri);

    /**
     * Social login via Facebook (Keycloak Identity Provider)
     * @param code Authorization code from Facebook OAuth
     * @param redirectUri Redirect URI used in the authorization request
     * @return Login response with tokens and user info
     */
    LoginResponse loginWithFacebook(String code, String redirectUri);
}
