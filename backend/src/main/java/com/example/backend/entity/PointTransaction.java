package com.example.backend.entity;

import com.example.backend.entity.enums.PointTransactionType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "point_transactions", indexes = {
    @Index(name = "idx_point_customer", columnList = "customer_id"),
    @Index(name = "idx_point_type", columnList = "transactionType"),
    @Index(name = "idx_point_created", columnList = "createdAt"),
    @Index(name = "idx_point_customer_type", columnList = "customer_id, transactionType"),
    @Index(name = "idx_point_customer_created", columnList = "customer_id, createdAt")
})
// Lịch sử điểm
public class PointTransaction {
    @Id
    @UuidGenerator
    private String transactionId;

    private int pointsChange; // Có thể âm (khi dùng điểm) hoặc dương (khi tích điểm)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PointTransactionType transactionType;

    private String reason; // "Đặt hàng thành công", "Đánh giá sản phẩm", "Đổi xu", v.v.

    @CreationTimestamp
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
}
