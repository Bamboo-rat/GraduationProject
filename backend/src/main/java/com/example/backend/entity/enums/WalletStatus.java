package com.example.backend.entity.enums;

/**
 * Trạng thái của ví tiền nhà cung cấp
 */
public enum WalletStatus {
    ACTIVE,      // Ví đang hoạt động bình thường
    SUSPENDED,   // Ví bị tạm khóa (vi phạm quy định)
    FROZEN,      // Ví bị đóng băng (đang điều tra)
    CLOSED       // Ví đã đóng (nhà cung cấp ngừng hoạt động)
}
