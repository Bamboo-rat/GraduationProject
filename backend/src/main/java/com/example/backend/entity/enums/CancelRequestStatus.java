package com.example.backend.entity.enums;

/**
 * Trạng thái yêu cầu hủy đơn hàng
 */
public enum CancelRequestStatus {
    /**
     * Đang chờ xét duyệt từ nhà cung cấp
     */
    PENDING_REVIEW,
    
    /**
     * Đã được phê duyệt - đơn hàng sẽ bị hủy
     */
    APPROVED,
    
    /**
     * Bị từ chối - đơn hàng vẫn tiếp tục xử lý
     */
    REJECTED
}
