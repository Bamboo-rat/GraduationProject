package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum ReturnRequestStatus {
    PENDING("Đang chờ xử lý"),
    APPROVED("Đã chấp nhận"),
    REJECTED("Đã từ chối");

    private final String description;

    ReturnRequestStatus(String description) {
        this.description = description;
    }
}
