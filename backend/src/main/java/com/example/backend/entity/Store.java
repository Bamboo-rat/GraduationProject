package com.example.backend.entity;

import com.example.backend.entity.enums.StoreStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stores", indexes = {
    @Index(name = "idx_store_name", columnList = "storeName"),
    @Index(name = "idx_store_status", columnList = "status"),
    @Index(name = "idx_store_supplier", columnList = "supplier_id"),
    @Index(name = "idx_store_location", columnList = "latitude, longitude"),
    @Index(name = "idx_store_rating", columnList = "rating"),
    @Index(name = "idx_store_supplier_status", columnList = "supplier_id, status"),
    @Index(name = "idx_store_status_rating", columnList = "status, rating")
})
public class Store {
    @Id
    @UuidGenerator
    private String storeId;

    @Column(nullable = false)
    private String storeName; // Tên cửa hàng cụ thể

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String latitude;

    @Column(nullable = false)
    private String longitude;

    private String phoneNumber;
    private String description;
    private String imageUrl;

    @DecimalMin(value = "0.0", message = "Rating must be positive")
    @DecimalMax(value = "5.0", message = "Rating cannot exceed 5.0")
    private BigDecimal rating;

    private Integer totalReviews = 0;

    private LocalTime openTime;
    private LocalTime closeTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StoreStatus status = StoreStatus.ACTIVE;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<StoreProduct> storeProducts = new ArrayList<>();

    @OneToMany(mappedBy = "store", fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();

    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Cart> carts = new ArrayList<>();

    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<FavoriteStore> favoritedBy = new ArrayList<>();
}
