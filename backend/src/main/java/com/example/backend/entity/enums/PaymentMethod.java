package com.example.backend.entity.enums;

import lombok.Getter;

@Getter
public enum PaymentMethod {
    COD("Thanh toán khi nhận hàng", "Cash on delivery payment method"),
    BANK_TRANSFER("Chuyển khoản ngân hàng", "Direct bank transfer payment"),
    E_WALLET("Ví điện tử", "Electronic wallet payment (VNPay, Momo, etc.)");

    private final String displayName;
    private final String description;

    PaymentMethod(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }
}
