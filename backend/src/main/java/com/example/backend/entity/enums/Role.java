package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum Role {
    ROLE_SUPER_ADMIN("Quản trị viên cao nhất", "Super administrator with full system access"),
    ROLE_MODERATOR("Kiểm duyệt viên", "Moderator for content review and product approval"),
    ROLE_STAFF("Nhân viên", "Staff member for customer support and operations");

    private final String displayName;
    private final String description;

    Role(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
