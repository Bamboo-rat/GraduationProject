package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum PromotionType {
    PERCENTAGE("Giảm giá phần trăm", "Discount based on percentage of order value"),
    FIXED_AMOUNT("Giảm giá cố định", "Fixed amount discount from order total"),
    FREE_SHIPPING("Miễn phí vận chuyển", "Free shipping promotion");

    private final String displayName;
    private final String description;

    PromotionType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
