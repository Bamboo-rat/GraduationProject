package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum ProductStatus {
    PENDING_APPROVAL("Chờ duyệt", "Product is waiting for admin approval"),
    APPROVED("Đã duyệt", "Product has been approved and is available for sale"),
    REJECTED("Bị từ chối", "Product has been rejected due to policy violations"),
    SOLD_OUT("Hết hàng", "Product is temporarily out of stock");

    private final String displayName;
    private final String description;

    ProductStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
