package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum StoreStatus {
    PENDING("Chờ duyệt", "Store is pending approval"),
    ACTIVE("Đang hoạt động", "Store is active and operating normally"),
    REJECTED("Bị từ chối", "Store application was rejected by admin"),
    SUSPENDED("Bị tạm khóa", "Store is suspended by admin"),
    TEMPORARILY_CLOSED("Tạm đóng cửa", "Store is temporarily closed"),
    PERMANENTLY_CLOSED("Đóng cửa vĩnh viễn", "Store is permanently closed"),
    UNDER_MAINTENANCE("Đang bảo trì", "Store is under maintenance");

    private final String displayName;
    private final String description;

    StoreStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}

