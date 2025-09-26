package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum PromotionTier {
    GENERAL("Khuyến mãi chung", "Áp dụng cho tất cả khách hàng"),
    BRONZE_PLUS("Khuyến mãi Đồng+", "Dành cho thành viên từ Đồng trở lên"),
    SILVER_PLUS("Khuyến mãi Bạc+", "Dành cho thành viên từ Bạc trở lên"),
    GOLD_PLUS("Khuyến mãi Vàng+", "Dành cho thành viên từ Vàng trở lên"),
    PLATINUM_PLUS("Khuyến mãi Bạch Kim+", "Dành cho thành viên từ Bạch Kim trở lên"),
    DIAMOND_ONLY("Khuyến mãi VIP Kim Cương", "Dành riêng cho thành viên Kim Cương"),
    BIRTHDAY("Khuyến mãi sinh nhật", "Dành cho khách hàng sinh nhật trong tháng"),
    FIRST_TIME("Khuyến mãi lần đầu", "Dành cho khách hàng mới");

    private final String displayName;
    private final String description;

    PromotionTier(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

}
