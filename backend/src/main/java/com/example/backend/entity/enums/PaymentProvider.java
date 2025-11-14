package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum PaymentProvider {
    VNPAY("VNPay"),
    MOMO("MoMo"),
    ZALOPAY("ZaloPay"),
    SHOPEEPAY("ShopeePay"),
    PAYOS("PayOS"),
    INTERNAL("Hệ thống nội bộ"); // Dành cho COD hoặc chuyển khoản trực tiếp

    private final String displayName;

    PaymentProvider(String displayName) {
        this.displayName = displayName;
    }
}