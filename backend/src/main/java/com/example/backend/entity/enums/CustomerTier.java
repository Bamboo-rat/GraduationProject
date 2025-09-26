package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum CustomerTier {
    BRONZE(0, 499, "Thành viên Đồng", "Hạng thành viên cơ bản với quyền lợi tiêu chuẩn"),
    SILVER(500, 1999, "Thành viên Bạc", "Hạng thành viên với ưu đãi giảm giá và tích điểm thêm"),
    GOLD(2000, 4999, "Thành viên Vàng", "Hạng thành viên cao cấp với nhiều quyền lợi đặc biệt"),
    PLATINUM(5000, 9999, "Thành viên Bạch Kim", "Hạng thành viên VIP với ưu đãi độc quyền"),
    DIAMOND(10000, Integer.MAX_VALUE, "Thành viên Kim Cương", "Hạng thành viên cao nhất với đặc quyền tối đa");

    private final int minPoints;
    private final int maxPoints;
    private final String displayName;
    private final String description;

    CustomerTier(int minPoints, int maxPoints, String displayName, String description) {
        this.minPoints = minPoints;
        this.maxPoints = maxPoints;
        this.displayName = displayName;
        this.description = description;
    }

}
