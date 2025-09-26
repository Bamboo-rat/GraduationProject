package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum ShipmentStatus {
    PREPARING("Đang chuẩn bị", "Shipment is being prepared for delivery"),
    SHIPPING("Đang giao hàng", "Shipment is in transit to customer"),
    DELIVERED("Đã giao thành công", "Shipment has been successfully delivered"),
    FAILED("Giao hàng thất bại", "Shipment delivery failed"),
    CANCELED("Đã hủy", "Shipment has been canceled");

    private final String displayName;
    private final String description;

    ShipmentStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
