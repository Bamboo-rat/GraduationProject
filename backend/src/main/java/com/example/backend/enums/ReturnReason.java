package com.example.backend.enums;

import lombok.Getter;

@Getter
public enum ReturnReason {
    DEFECTIVE_PRODUCT("Sản phẩm lỗi/hỏng"),
    WRONG_ITEM("Giao sai hàng"),
    NOT_AS_DESCRIBED("Không đúng mô tả"),
    POOR_QUALITY("Chất lượng kém"),
    DAMAGED_IN_SHIPPING("Hư hỏng trong quá trình vận chuyển"),
    CHANGED_MIND("Đổi ý không muốn mua nữa"),
    OTHER("Lý do khác");

    private final String description;

    ReturnReason(String description) {
        this.description = description;
    }
}
