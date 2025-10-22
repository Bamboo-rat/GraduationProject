package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

/**
 * Entity quản lý danh sách cửa hàng yêu thích của khách hàng
 * Cho phép khách hàng lưu lại các cửa hàng để truy cập nhanh sau này
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "favorite_stores", 
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_customer_store", columnNames = {"customer_id", "store_id"})
    },
    indexes = {
        @Index(name = "idx_favorite_customer", columnList = "customer_id"),
        @Index(name = "idx_favorite_store", columnList = "store_id"),
        @Index(name = "idx_favorite_created", columnList = "createdAt")
    }
)
public class FavoriteStore {
    
    @Id
    @UuidGenerator
    private String favoriteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Số lần khách hàng đã đặt hàng ở cửa hàng này
    @Column(nullable = false)
    private Integer orderCount = 0;

    // Lần cuối khách hàng đặt hàng ở cửa hàng này
    private LocalDateTime lastOrderDate;
}
