package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum ProductStatus {
    ACTIVE("Đang hoạt động", "Product is active and available for purchase"),
    INACTIVE("Tạm ẩn", "Product is temporarily hidden by supplier"),
    SOLD_OUT("Hết hàng", "Product is out of stock (auto-set when inventory = 0)"),
    EXPIRED("Hết hạn", "Product has passed expiry date (auto-set)"),
    SUSPENDED("Bị khóa", "Product is suspended by admin for policy violation"),
    DELETED("Đã xóa", "Product is soft-deleted (removed from listings)");

    private final String displayName;
    private final String description;

    ProductStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
