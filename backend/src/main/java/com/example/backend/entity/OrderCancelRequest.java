package com.example.backend.entity;

import com.example.backend.entity.enums.CancelRequestStatus;
import com.example.backend.enums.OrderRequestType;
import com.example.backend.enums.ReturnReason;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity quản lý yêu cầu hủy/trả đơn hàng
 * - CANCEL: Áp dụng cho đơn hàng từ trạng thái PREPARING trở đi
 * - RETURN: Áp dụng cho đơn hàng đã DELIVERED (trong vòng 7 ngày)
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
        @Index(name = "idx_cancel_request_type", columnList = "request_type"),
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

    /**
     * Loại yêu cầu: CANCEL (hủy đơn) hoặc RETURN (trả hàng)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 20)
    private OrderRequestType requestType = OrderRequestType.CANCEL;

    /**
     * Lý do hủy/trả hàng (dạng text tự do cho CANCEL)
     */
    @Column(nullable = false, length = 1000)
    private String reason;

    /**
     * Lý do trả hàng (enum cho RETURN)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "return_reason", length = 50)
    private ReturnReason returnReason;

    /**
     * Hình ảnh minh chứng (dùng cho RETURN)
     */
    @ElementCollection
    @CollectionTable(name = "order_request_images", 
                    joinColumns = @JoinColumn(name = "request_id"))
    @Column(name = "image_url", length = 500)
    private List<String> imageUrls = new ArrayList<>();

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

    /**
     * Số tiền hoàn lại (dùng cho RETURN khi approved)
     */
    @Column(name = "refund_amount")
    private Double refundAmount;
}
