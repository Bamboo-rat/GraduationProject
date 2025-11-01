package com.example.backend.service;

import com.example.backend.dto.request.CustomerUpdateRequest;
import com.example.backend.dto.request.PhoneAuthStep1Request;
import com.example.backend.dto.request.PhoneAuthStep2Request;
import com.example.backend.dto.response.CustomerResponse;
import com.example.backend.dto.response.LoginResponse;
import com.example.backend.dto.response.PhoneAuthStep1Response;
import com.example.backend.entity.enums.CustomerStatus;
import com.example.backend.entity.enums.CustomerTier;
import org.springframework.data.domain.Page;

import java.util.Map;

/**
 * Service interface for customer-related operations
 */
public interface CustomerService {
    
    // ===== NEW UNIFIED PHONE AUTHENTICATION API =====
    
    /**
     * Step 1: Send OTP for phone authentication (unified login/register)
     * - If phone exists: Send OTP for login
     * - If phone doesn't exist: Auto-create account + Send OTP
     * 
     * @param request Phone authentication step 1 request
     * @return PhoneAuthStep1Response with account status and OTP info
     */
    PhoneAuthStep1Response phoneAuthStep1(PhoneAuthStep1Request request);
    
    /**
     * Step 2: Verify OTP and authenticate (unified login/register)
     * - Verify OTP from Redis
     * - If new account: Activate account + Create Keycloak user
     * - Return JWT tokens for login
     * 
     * @param request Phone authentication step 2 request
     * @return LoginResponse with JWT tokens and user info
     */
    LoginResponse phoneAuthStep2(PhoneAuthStep2Request request);
    
    /**
     * Get customer information by Keycloak ID
     * 
     * @param keycloakId Keycloak user ID
     * @return CustomerResponse
     */
    CustomerResponse getCustomerInfo(String keycloakId);
    
    /**
     * Get customer by user ID
     * 
     * @param userId Customer user ID
     * @return CustomerResponse
     */
    CustomerResponse getCustomerById(String userId);
    
    /**
     * Update customer profile
     * 
     * @param keycloakId Keycloak user ID
     * @param request Profile update request
     * @return Updated CustomerResponse
     */
    CustomerResponse updateProfile(String keycloakId, CustomerUpdateRequest request);
    
    /**
     * Update customer active status (admin only)
     *
     * @param userId Customer user ID
     * @param active Active status
     * @return Updated CustomerResponse
     */
    CustomerResponse setActive(String userId, boolean active);

    /**
     * Get all customers with pagination and filtering (admin only)
     *
     * @param page Page number (0-indexed)
     * @param size Page size
     * @param status Filter by status (optional)
     * @param tier Filter by tier (optional)
     * @param search Search by name, email, or phone (optional)
     * @param sortBy Sort field (default: createdAt)
     * @param sortDirection Sort direction (ASC/DESC, default: DESC)
     * @return Page of customers
     */
    Page<CustomerResponse> getAllCustomers(
            int page,
            int size,
            CustomerStatus status,
            CustomerTier tier,
            String search,
            String sortBy,
            String sortDirection
    );

    /**
     * Get customer statistics (admin only)
     *
     * @return Map with statistics
     */
    Map<String, Object> getCustomerStats();
}
