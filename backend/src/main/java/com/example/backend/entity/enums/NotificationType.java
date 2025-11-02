package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum NotificationType {
    // Order related
    NEW_ORDER("Đơn hàng mới", "New order notification"),
    ORDER_STATUS_UPDATE("Cập nhật đơn hàng", "Order status update notification"),

    // Supplier related (for admins)
    NEW_SUPPLIER_REGISTRATION("Nhà cung cấp mới đăng ký", "New supplier registration notification"),
    SUPPLIER_UPDATE("Cập nhật thông tin nhà cung cấp", "Supplier profile update notification"),
    SUPPLIER_UPDATE_PENDING("Đề xuất cập nhật thông tin nhà cung cấp", "Supplier business info update pending"),
    SUPPLIER_UPDATE_APPROVED("Cập nhật thông tin được phê duyệt", "Supplier business info update approved"),
    SUPPLIER_UPDATE_REJECTED("Cập nhật thông tin bị từ chối", "Supplier business info update rejected"),

    // Category related (for admins)
    NEW_CATEGORY_SUGGESTION("Đề xuất danh mục mới", "New category suggestion notification"),

    // Approval related (for suppliers)
    SUPPLIER_APPROVED("Tài khoản được phê duyệt", "Supplier account approved notification"),
    SUPPLIER_REJECTED("Tài khoản bị từ chối", "Supplier account rejected notification"),
    STORE_APPROVED("Cửa hàng được phê duyệt", "Store approved notification"),
    STORE_REJECTED("Cửa hàng bị từ chối", "Store rejected notification"),

    // Account status related
    SUPPLIER_PAUSED("Tạm dừng hoạt động", "Supplier operations paused notification"),
    SUPPLIER_RESUMED("Khôi phục hoạt động", "Supplier operations resumed notification"),
    SUPPLIER_SUSPENDED("Tài khoản bị đình chỉ", "Supplier account suspended notification"),
    SUPPLIER_UNSUSPENDED("Tài khoản được kích hoạt lại", "Supplier account unsuspended notification"),

    // General
    PROMOTION("Khuyến mãi", "Promotion and discount notification"),
    NEW_MESSAGE("Tin nhắn mới", "New message notification"),
    SYSTEM_ANNOUNCEMENT("Thông báo hệ thống", "System announcement notification");

    private final String displayName;
    private final String description;

    NotificationType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}