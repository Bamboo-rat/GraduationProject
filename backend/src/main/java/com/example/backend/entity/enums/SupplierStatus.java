package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum SupplierStatus {
    PENDING_APPROVAL("Chờ duyệt", "Supplier is pending approval"),
    ACTIVE("Đang hoạt động", "Supplier is active and can sell products"),
    SUSPENDED("Tạm ngưng", "Supplier is suspended due to violations"),
    PAUSE("Tạm dừng", "Supplier has paused operations temporarily");

    private final String displayName;
    private final String description;

    SupplierStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
