package com.example.backend.service;

import com.example.backend.dto.request.CustomerUpdateRequest;
import com.example.backend.dto.request.CustomerRequest;
import com.example.backend.dto.response.CustomerResponse;
import com.example.backend.dto.response.LoginResponse;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.entity.enums.CustomerStatus;
import com.example.backend.entity.enums.CustomerTier;
import org.springframework.data.domain.Page;

import java.util.Map;

/**
 * Service interface for customer-related operations
 */
public interface CustomerService {
    /**
     * Send OTP to customer's phone for login (console log in dev mode)
     * @param phoneNumber Customer's phone number
     */
    void sendLoginOtp(String phoneNumber);

    /**
     * Verify OTP and login, return JWT token
     * @param phoneNumber Customer's phone number
     * @param otp OTP code
     * @return LoginResponse with JWT token
     */
    LoginResponse verifyLoginOtpAndLogin(String phoneNumber, String otp);
    
    /**
     * Step 1: Register customer with phone number only
     * - Generates random username (user_xxxxxxxx)
     * - Creates account with PENDING_VERIFICATION status
     * - Sends OTP to phone via eSMS
     * 
     * @param request Customer registration request with phone number
     * @return RegisterResponse with userId and OTP sent message
     */
    RegisterResponse registerStep1(CustomerRequest request);
    
    /**
     * Step 2: Verify OTP sent to phone number via eSMS
     * - Verifies OTP from Redis
     * - Activates customer account (status = ACTIVE)
     * - Generates random password and creates Keycloak user
     * - Assigns 'customer' role in Keycloak
     * 
     * @param phoneNumber Customer's phone number
     * @param otp OTP code received via SMS (6 digits)
     * @return RegisterResponse with complete account details and temp password
     */
    RegisterResponse verifyOtpStep2(String phoneNumber, String otp);
    
    /**
     * Resend OTP to customer's phone number
     * 
     * @param phoneNumber Customer's phone number
     * @return Success message
     */
    String resendOtp(String phoneNumber);
    
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
