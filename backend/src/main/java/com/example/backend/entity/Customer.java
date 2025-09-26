package com.example.backend.entity;

import com.example.backend.entity.enums.CustomerStatus;
import com.example.backend.entity.enums.CustomerTier;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "customers", indexes = {
    @Index(name = "idx_customer_status", columnList = "status"),
    @Index(name = "idx_customer_tier", columnList = "tier"),
    @Index(name = "idx_customer_status_tier", columnList = "status, tier"),
    @Index(name = "idx_customer_points", columnList = "points"),
    @Index(name = "idx_customer_lifetime_points", columnList = "lifetimePoints"),
    @Index(name = "idx_customer_tier_updated", columnList = "tierUpdatedAt"),
    @Index(name = "idx_customer_birth_month", columnList = "dateOfBirth")
})
public class Customer extends User {

    private int points;
    private String avatarUrl;
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CustomerStatus status = CustomerStatus.PENDING_VERIFICATION;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CustomerTier tier = CustomerTier.BRONZE;

    // Thông tin tier
    private LocalDateTime tierUpdatedAt;
    private int lifetimePoints = 0; // Tổng điểm tích lũy từ trước đến nay
    private int pointsThisYear = 0; // Điểm tích lũy trong năm (để reset hàng năm)

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Address> addresses = new ArrayList<>();

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Cart> carts = new ArrayList<>();

    @OneToMany(mappedBy = "customer", fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();

    @OneToMany(mappedBy = "customer", fetch = FetchType.LAZY)
    private List<Review> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<PointTransaction> pointTransactions = new ArrayList<>();
}
