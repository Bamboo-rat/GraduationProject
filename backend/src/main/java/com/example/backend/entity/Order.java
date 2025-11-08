package com.example.backend.entity;

import com.example.backend.entity.enums.OrderStatus;
import com.example.backend.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_order_status", columnList = "status"),
    @Index(name = "idx_order_customer", columnList = "customer_id"),
    @Index(name = "idx_order_store", columnList = "store_id"),
    @Index(name = "idx_order_created", columnList = "createdAt"),
    @Index(name = "idx_order_updated", columnList = "updatedAt"),
    @Index(name = "idx_order_total", columnList = "totalAmount"),
    @Index(name = "idx_order_customer_status", columnList = "customer_id, status"),
    @Index(name = "idx_order_store_status", columnList = "store_id, status"),
    @Index(name = "idx_order_customer_created", columnList = "customer_id, createdAt"),
    @Index(name = "idx_order_status_created", columnList = "status, createdAt"),
    @Index(name = "idx_order_idempotency", columnList = "idempotencyKey", unique = true)
})
public class Order {
    @Id
    @UuidGenerator
    private String orderId;

    @Column(unique = true, nullable = false)
    private String orderCode;

    @Column(unique = true, nullable = false, length = 100)
    private String idempotencyKey;

    private BigDecimal totalAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal discount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(length = 500)
    private String shippingAddress;

    @Column(length = 1000)
    private String note;

    @Column(length = 500)
    private String cancelReason;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime confirmedAt;

    private LocalDateTime shippedAt;

    private LocalDateTime deliveredAt;

    private LocalDateTime cancelledAt;

    private LocalDateTime estimatedDelivery;

    private LocalDateTime actualDelivery;

    /**
     * Flag to track if balance has been released from pending to available
     * True = balance released, False = still in pending (within 7-day hold period)
     */
    @Column(nullable = false)
    private boolean balanceReleased = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderDetail> orderDetails = new ArrayList<>();

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payment payment;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Shipment shipment;

    @OneToMany(mappedBy = "order", cascade = CascadeType.PERSIST, fetch = FetchType.LAZY)
    private List<PromotionUsage> promotionUsages = new ArrayList<>();
}
