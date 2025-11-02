package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum ViolationType {
    SPAM_REVIEW("Spam đánh giá", "Spam review or comment detected"),
    SPAM_COMMENT("Spam bình luận", "Excessive comments in short time"),
    BANNED_KEYWORD("Từ khóa cấm", "Comment contains banned keywords"),
    ORDER_CANCELLATION("Hủy đơn hàng", "Excessive order cancellations"),
    COMMUNITY_REPORT("Báo cáo cộng đồng", "Reported by other users"),
    HARASSMENT("Quấy rối", "Harassment or abusive behavior"),
    FRAUDULENT_ACTIVITY("Gian lận", "Fraudulent or suspicious activity"),
    POLICY_VIOLATION("Vi phạm chính sách", "Terms of service violation");

    private final String displayName;
    private final String description;

    ViolationType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
