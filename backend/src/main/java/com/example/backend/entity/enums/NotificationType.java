package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum NotificationType {
    NEW_ORDER("Đơn hàng mới", "New order notification"),
    ORDER_STATUS_UPDATE("Cập nhật đơn hàng", "Order status update notification"),
    PROMOTION("Khuyến mãi", "Promotion and discount notification"),
    NEW_MESSAGE("Tin nhắn mới", "New message notification"),
    SYSTEM_ANNOUNCEMENT("Thông báo hệ thống", "System announcement notification");

    private final String displayName;
    private final String description;

    NotificationType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}