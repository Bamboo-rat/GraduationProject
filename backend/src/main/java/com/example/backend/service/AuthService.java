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
     * Request OTP for customer login via phone number
     * @param phoneNumber Customer phone number
     * @return Message confirming OTP sent
     */
    String requestCustomerLoginOtp(String phoneNumber);

    /**
     * Verify OTP and login customer (passwordless)
     * @param phoneNumber Customer phone number
     * @param otp OTP code
     * @return Login response with tokens
     */
    LoginResponse verifyCustomerLoginOtp(String phoneNumber, String otp);
}
