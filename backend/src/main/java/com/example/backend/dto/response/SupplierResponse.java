package com.example.backend.dto.response;

import com.example.backend.entity.enums.BusinessType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Detailed response DTO for Supplier information
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierResponse {
    
    // User basic info
    private String userId;
    private String keycloakId;
    private String username;
    private String email;
    private String phoneNumber;
    private String fullName;
    private String avatarUrl;
    private boolean active;
    
    // Business information
    private String businessName;
    private String businessLicense;
    private String businessLicenseUrl;
    private String foodSafetyCertificate;
    private String foodSafetyCertificateUrl;
    private String taxCode;
    private String businessAddress;
    private BusinessType businessType;
    
    // Financial information (sensitive - may hide for non-admin)
    private Double commissionRate;
    private String bankAccountNumber;
    private String bankName;
    private String bankBranch;
    
    // Status
    private String status; // PENDING_APPROVAL, ACTIVE, SUSPENDED, BANNED
    
    // Statistics
    private Integer totalProducts;
    private Integer totalStores;
    private List<StoreBasicInfo> stores;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Nested DTO for basic store information
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StoreBasicInfo {
        private String storeId;
        private String storeName;
        private String address;
        private String phoneNumber;
        private String status;
    }
}
