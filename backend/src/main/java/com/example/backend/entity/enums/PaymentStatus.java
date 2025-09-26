package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum PaymentStatus {
    PENDING("Chờ thanh toán", "Payment is being processed"),
    SUCCESS("Thanh toán thành công", "Payment completed successfully"),
    FAILED("Thanh toán thất bại", "Payment failed or was declined"),
    REFUNDED("Đã hoàn tiền", "Payment has been refunded to customer");

    private final String displayName;
    private final String description;

    PaymentStatus(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
