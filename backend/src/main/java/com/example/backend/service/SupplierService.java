package com.example.backend.service;

import com.example.backend.dto.request.*;
import com.example.backend.dto.response.RegisterResponse;
import com.example.backend.dto.response.SupplierResponse;
import com.example.backend.entity.enums.SupplierStatus;

/**
 * Service for Supplier management with 4-step registration flow
 */
public interface SupplierService {

    // ========== 4-STEP REGISTRATION FLOW ==========

    /**
     * Step 1: Register supplier account (username, email, password, phone, fullName)
     * Status: PENDING_VERIFICATION
     * @param request Step 1 request
     * @return Registration response with supplierId
     */
    RegisterResponse registerStep1(SupplierRegisterStep1Request request);

    /**
     * Step 2: Verify email with OTP
     * Status: PENDING_VERIFICATION -> PENDING_DOCUMENTS
     * @param supplierId Supplier ID from step 1 (String UUID)
     * @param request Step 2 request with OTP
     * @return Success message
     */
    String verifyEmailStep2(String supplierId, SupplierRegisterStep2Request request);

    /**
     * Resend OTP for email verification
     * @param supplierId Supplier ID (String UUID)
     * @return Success message
     */
    String resendOtp(String supplierId);

    /**
     * Step 3: Upload business documents (businessLicense, foodSafetyCertificate, avatar)
     * Status: PENDING_DOCUMENTS -> PENDING_STORE_INFO
     * @param supplierId Supplier ID from step 1 (String UUID)
     * @param request Step 3 request with document URLs
     * @return Success message
     */
    String uploadDocumentsStep3(String supplierId, SupplierRegisterStep3Request request);

    /**
     * Step 4: Submit store information and business details
     * Status: PENDING_STORE_INFO -> PENDING_APPROVAL (waiting for admin approval)
     * @param supplierId Supplier ID from step 1 (String UUID)
     * @param request Step 4 request with business info and store details
     * @return Success message
     */
    String submitStoreInfoStep4(String supplierId, SupplierRegisterStep4Request request);

    // ========== PROFILE MANAGEMENT ==========

    /**
     * Get supplier information by keycloakId
     * @param keycloakId Keycloak user ID
     * @return Supplier response
     */
    SupplierResponse getSupplierInfo(String keycloakId);

    /**
     * Get public supplier information (hide sensitive data)
     * @param supplierId Supplier ID (String UUID)
     * @return Public supplier response
     */
    SupplierResponse getPublicSupplierInfo(String supplierId);

    /**
     * Get supplier information by userId
     * @param userId User ID (String UUID)
     * @return Supplier response
     */
    SupplierResponse getSupplierById(String userId);

    /**
     * Update supplier profile (name, phone, avatar, businessAddress)
     * @param keycloakId Keycloak user ID
     * @param request Update request
     * @return Updated supplier response
     */
    SupplierResponse updateProfile(String keycloakId, SupplierProfileUpdateRequest request);

    // ========== ADMIN OPERATIONS ==========

    /**
     * Get all suppliers with pagination, search, and filtering
     * @param page Page number (0-indexed)
     * @param size Page size
     * @param status Filter by status (optional)
     * @param search Search by name, email, or business name (optional)
     * @param sortBy Sort field (optional, default: createdAt)
     * @param sortDirection Sort direction (ASC/DESC, default: DESC)
     * @return Page of suppliers
     */
    org.springframework.data.domain.Page<SupplierResponse> getAllSuppliers(
            int page,
            int size,
            SupplierStatus status,
            String search,
            String sortBy,
            String sortDirection
    );

    /**
     * Approve supplier (set status to ACTIVE and send email notification)
     * @param userId User ID (String UUID)
     * @param approvalNote Optional note from admin
     * @return Updated supplier response
     */
    SupplierResponse approveSupplier(String userId, String approvalNote);

    /**
     * Reject supplier (set status to REJECTED and send email notification)
     * @param userId User ID (String UUID)
     * @param rejectionReason Reason for rejection
     * @return Updated supplier response
     */
    SupplierResponse rejectSupplier(String userId, String rejectionReason);

    /**
     * Update supplier status (by admin)
     * @param userId User ID (String UUID)
     * @param status New status
     * @return Updated supplier response
     */
    SupplierResponse updateStatus(String userId, SupplierStatus status);

    /**
     * Update supplier commission rate (by admin)
     * @param userId User ID (String UUID)
     * @param request Commission update request
     * @return Updated supplier response
     */
    SupplierResponse updateCommissionRate(String userId, SupplierCommissionUpdateRequest request);

    /**
     * Activate/Deactivate supplier account (by admin)
     * @param userId User ID (String UUID)
     * @param active Active status
     * @return Updated supplier response
     */
    SupplierResponse setActive(String userId, boolean active);
}
