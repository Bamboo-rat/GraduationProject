package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum CustomerStatus {
    ACTIVE("Hoạt động", "Customer account is active and fully functional"),
    INACTIVE("Không hoạt động", "Customer account is voluntarily inactive"),
    SUSPENDED("Tạm ngưng", "Customer account is temporarily suspended due to violations"),
    BANNED("Bị cấm", "Customer account is permanently banned"),
    PENDING_VERIFICATION("Chờ xác thực", "New customer account pending email verification"),
    RESTRICTED("Hạn chế", "Customer account has limited functionality");

    private final String displayName;
    private final String description;

    CustomerStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
