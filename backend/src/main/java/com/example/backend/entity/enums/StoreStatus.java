package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum StoreStatus {
    PENDING("Chờ duyệt", "Store is pending approval"),
    ACTIVE("Đang hoạt động", "Store is active and operating normally"),
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

