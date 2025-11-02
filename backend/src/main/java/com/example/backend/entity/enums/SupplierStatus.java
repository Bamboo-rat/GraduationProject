package com.example.backend.entity.enums;

import lombok.Getter;

/**
 * Supplier registration and operational status
 * 
 * Registration flow:
 * 1. PENDING_VERIFICATION - Just registered, waiting for email OTP verification
 * 2. PENDING_DOCUMENTS - Email verified, waiting for document upload
 * 3. PENDING_STORE_INFO - Documents uploaded, waiting for store information
 * 4. PENDING_APPROVAL - All info submitted, waiting for admin approval
 * 5. ACTIVE - Approved and can operate
 */
@Getter
public enum

SupplierStatus {
    PENDING_VERIFICATION("Chờ xác thực", "Supplier is pending email verification"),
    PENDING_DOCUMENTS("Chờ tải tài liệu", "Supplier is pending document upload"),
    PENDING_STORE_INFO("Chờ thông tin cửa hàng", "Supplier is pending store information"),
    PENDING_APPROVAL("Chờ phê duyệt", "Supplier is pending admin approval"),
    ACTIVE("Đang hoạt động", "Supplier is active and can sell products"),
    SUSPENDED("Tạm ngưng", "Supplier is suspended due to violations"),
    PAUSE("Tạm dừng", "Supplier has paused operations temporarily"),
    REJECTED("Từ chối", "Supplier application was rejected by admin");

    private final String displayName;
    private final String description;

    SupplierStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
