package com.example.backend.entity.enums;

/**
 * Loại giao dịch trong ví tiền
 */
public enum TransactionType {
    // Thu nhập
    ORDER_COMPLETED,            // Đơn hàng hoàn thành → pending balance
    END_OF_DAY_RELEASE,        // Cuối ngày: pending → available
    ADMIN_DEPOSIT,              // Admin nạp tiền thủ công (bonus, compensation...)
    
    // Chi phí
    ORDER_REFUND,               // Hoàn tiền cho khách hàng khi hủy đơn
    END_OF_MONTH_WITHDRAWAL,    // Cuối tháng: available → withdrawn (tự động)
    COMMISSION_FEE,             // Phí hoa hồng hệ thống
    PENALTY_FEE,                // Phí phạt (vi phạm quy định)
    ADMIN_DEDUCTION,            // Admin trừ tiền (xử phạt...)
    
    // Điều chỉnh
    ADJUSTMENT                  // Điều chỉnh số dư (sửa lỗi...)
}
