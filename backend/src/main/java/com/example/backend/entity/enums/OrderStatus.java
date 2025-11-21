package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum OrderStatus {
    PENDING("Chờ xác nhận", "Order is waiting for confirmation"),
    CONFIRMED("Đã xác nhận", "Order has been confirmed by store"),
    PREPARING("Đang chuẩn bị", "Order is being prepared for shipping"),
    SHIPPING("Đang giao hàng", "Order is being delivered to customer"),
    DELIVERED("Đã giao thành công", "Order has been successfully delivered"),
    CANCELED("Đã hủy", "Order has been canceled"),
    PENDING_RETURN("Đang chờ xác nhận hoàn hàng", "Order return request is pending review"),
    RETURNED("Đã trả lại", "Order has been returned by customer");

    private final String displayName;
    private final String description;

    OrderStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}