package com.example.backend.entity;

import com.example.backend.entity.enums.CancelRequestStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

/**
 * Entity quản lý yêu cầu hủy đơn hàng
 * Áp dụng cho đơn hàng từ trạng thái PREPARING trở đi
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "order_cancel_requests",
    indexes = {
        @Index(name = "idx_cancel_request_order", columnList = "order_id"),
        @Index(name = "idx_cancel_request_customer", columnList = "customer_id"),
        @Index(name = "idx_cancel_request_status", columnList = "status"),
        @Index(name = "idx_cancel_request_created", columnList = "requested_at")
    }
)
public class OrderCancelRequest {
    
    @Id
    @UuidGenerator
    private String cancelRequestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CancelRequestStatus status = CancelRequestStatus.PENDING_REVIEW;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime reviewedAt;

    @Column(length = 36)
    private String reviewedBy; // User ID (admin hoặc supplier)

    @Column(length = 1000)
    private String reviewNote; // Ghi chú khi phê duyệt/từ chối
}
