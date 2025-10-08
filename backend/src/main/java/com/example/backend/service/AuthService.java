package com.example.backend.service;

import com.example.backend.dto.request.AdminRegisterRequest;
import com.example.backend.dto.request.CustomerRegisterRequest;
import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.SupplierRegisterRequest;
import com.example.backend.dto.response.LoginResponse;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.dto.response.UserInfoResponse;

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
     * Get current user information
     * @param keycloakId Keycloak user ID
     * @return User information
     */
    UserInfoResponse getUserInfo(String keycloakId);
}
