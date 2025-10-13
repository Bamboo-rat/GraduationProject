package com.example.backend.service;

import com.example.backend.dto.request.AdminRegisterRequest;
import com.example.backend.dto.request.CustomerRegisterRequest;
import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.SupplierRegisterRequest;
import com.example.backend.dto.response.*;
import org.springframework.security.oauth2.jwt.Jwt;

public interface AuthService {

    /**
     * Register a new customer
     * @param request Customer registration request
     * @return Registration response
     */
    RegisterResponse registerCustomer(CustomerRegisterRequest request);

    /**
     * Register a new supplier
     * @param request Supplier registration request
     * @return Registration response
     */
    RegisterResponse registerSupplier(SupplierRegisterRequest request);

    /**
     * Register a new admin/staff
     * @param request Admin registration request
     * @return Registration response
     */
    RegisterResponse registerAdmin(AdminRegisterRequest request);

    /**
     * Login user
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
     * Get detailed customer information
     * @param keycloakId Keycloak user ID
     * @return Detailed customer information
     */
    CustomerResponse getCustomerInfo(String keycloakId);

    /**
     * Get detailed supplier information
     * @param keycloakId Keycloak user ID
     * @return Detailed supplier information
     */
    SupplierResponse getSupplierInfo(String keycloakId);

    /**
     * Get detailed admin information
     * @param keycloakId Keycloak user ID
     * @return Detailed admin information
     */
    AdminResponse getAdminInfo(String keycloakId);

    /**
     * Verify customer email with token
     * @param token Verification token
     * @return Success message
     */
    String verifyEmail(String token);

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
     * Resend verification email to customer
     * @param email Customer email
     * @return Success message
     */
    String resendVerificationEmail(String email);
}
