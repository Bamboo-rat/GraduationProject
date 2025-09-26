package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum PromotionStatus {
    ACTIVE("Đang hoạt động", "Promotion is currently active and available"),
    INACTIVE("Không hoạt động", "Promotion is inactive or expired");

    private final String displayName;
    private final String description;

    PromotionStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
