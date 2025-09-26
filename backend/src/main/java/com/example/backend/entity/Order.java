package com.example.backend.entity;

import com.example.backend.entity.enums.OrderStatus;
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
    @Index(name = "idx_order_status_created", columnList = "status, createdAt")
})
public class Order {
    @Id
    @UuidGenerator
    private String orderId;

    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING;

    private String shippingAddress;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

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
    private List<OrderPromotion> appliedPromotions = new ArrayList<>();
}
