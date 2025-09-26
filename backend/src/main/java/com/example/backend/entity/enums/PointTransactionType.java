package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum PointTransactionType {
    EARN("Tích điểm", "Points earned from purchases or activities"),
    REDEEM("Sử dụng điểm", "Points redeemed for discounts or rewards"),
    EXPIRE("Hết hạn", "Points expired due to time limit"),
    ADJUST("Điều chỉnh", "Points adjusted by admin for corrections"),
    BONUS("Thưởng đặc biệt", "Bonus points from special promotions");

    private final String displayName;
    private final String description;

    PointTransactionType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
