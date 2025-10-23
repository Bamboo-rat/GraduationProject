package com.example.backend.dto.response;

import com.example.backend.entity.enums.BusinessType;
import com.example.backend.entity.enums.WalletStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
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
    
    private Double commissionRate;
    
    // Status
    private String status; // PENDING_APPROVAL, ACTIVE, SUSPENDED, BANNED
    
    // Wallet information
    private WalletInfo wallet;
    
    // Statistics
    private Integer totalProducts;
    private Integer totalStores;
    private List<StoreBasicInfo> stores;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Nested DTO for wallet information
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WalletInfo {
        private String walletId;
        private BigDecimal availableBalance;    // Số dư khả dụng (có thể rút)
        private BigDecimal pendingBalance;      // Số dư đang giữ (đơn hàng đang xử lý)
        private BigDecimal totalEarnings;       // Tổng thu nhập từ trước đến nay
        private BigDecimal totalWithdrawn;      // Tổng đã rút
        private BigDecimal totalRefunded;       // Tổng hoàn trả
        private BigDecimal monthlyEarnings;     // Thu nhập tháng hiện tại
        private String currentMonth;            // Tháng hiện tại (YYYY-MM)
        private WalletStatus status;            // Trạng thái ví
        private LocalDateTime lastWithdrawalDate; // Lần rút tiền cuối
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

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
