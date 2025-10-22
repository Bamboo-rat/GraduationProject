package com.example.backend.entity.enums;

/**
 * Trạng thái của giao dịch rút tiền
 */
public enum WithdrawalStatus {
    PENDING,        // Đang chờ xử lý
    PROCESSING,     // Đang xử lý chuyển khoản
    COMPLETED,      // Đã hoàn thành
    FAILED,         // Thất bại
    CANCELLED       // Đã hủy
}
