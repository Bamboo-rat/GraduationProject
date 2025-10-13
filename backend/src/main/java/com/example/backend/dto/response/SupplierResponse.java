package com.example.backend.dto.response;

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
    private boolean active;
    
    // Supplier specific info
    private String businessName;
    private String businessLicense; // Số giấy phép kinh doanh
    private String businessLicenseUrl; // URL trỏ tới file giấy phép
    private String taxCode; // Mã số thuế
    private String logoUrl;
    private String status; // PENDING_APPROVAL, APPROVED, REJECTED, SUSPENDED
    
    // Stores info
    private List<StoreBasicInfo> stores;
    
    // Statistics
    private Integer totalProducts;
    private Integer totalStores;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    /**
     * Basic store information for supplier response
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
