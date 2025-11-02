package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum ViolationAction {
    WARNING("Cảnh báo", "User warned about violation"),
    TEMPORARY_SUSPENSION("Tạm khóa", "Account temporarily suspended"),
    PERMANENT_BAN("Cấm vĩnh viễn", "Account permanently banned"),
    UNDER_REVIEW("Đang xem xét", "Under admin review"),
    NO_ACTION("Không hành động", "No action taken");

    private final String displayName;
    private final String description;

    ViolationAction(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
