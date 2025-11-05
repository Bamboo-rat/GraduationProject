package com.example.backend.enums;

import lombok.Getter;

@Getter
public enum OrderRequestType {
    CANCEL("Yêu cầu hủy đơn"),
    RETURN("Yêu cầu trả hàng");

    private final String description;

    OrderRequestType(String description) {
        this.description = description;
    }
}
