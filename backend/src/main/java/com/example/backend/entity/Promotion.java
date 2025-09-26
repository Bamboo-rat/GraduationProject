package com.example.backend.entity;

import com.example.backend.entity.enums.PromotionStatus;
import com.example.backend.entity.enums.PromotionTier;
import com.example.backend.entity.enums.PromotionType;
import jakarta.persistence.*;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "promotions", indexes = {
    @Index(name = "idx_promotion_code", columnList = "code"),
    @Index(name = "idx_promotion_status", columnList = "status"),
    @Index(name = "idx_promotion_type", columnList = "type"),
    @Index(name = "idx_promotion_tier", columnList = "tier"),
    @Index(name = "idx_promotion_dates", columnList = "startDate, endDate"),
    @Index(name = "idx_promotion_highlighted", columnList = "isHighlighted"),
    @Index(name = "idx_promotion_active_dates", columnList = "status, startDate, endDate"),
    @Index(name = "idx_promotion_tier_status", columnList = "tier, status")
})
public class Promotion {
    @Id
    @UuidGenerator
    private String promotionId;

    @Column(unique = true)
    private String code;

    private String title; // Tiêu đề khuyến mãi
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PromotionType type = PromotionType.PERCENTAGE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PromotionTier tier = PromotionTier.GENERAL;

    private BigDecimal discountValue; // Số tiền hoặc phần trăm giảm
    private BigDecimal minimumOrderAmount; // Đơn hàng tối thiểu
    private BigDecimal maxDiscountAmount; // Số tiền giảm tối đa

    private LocalDate startDate;
    private LocalDate endDate;

    // Giới hạn sử dụng
    private Integer totalUsageLimit; // Tổng số lần sử dụng
    private Integer usagePerCustomerLimit; // Giới hạn mỗi khách hàng
    private Integer currentUsageCount = 0; // Số lần đã sử dụng

    @Enumerated(EnumType.STRING)
    private PromotionStatus status = PromotionStatus.ACTIVE;

    private boolean isHighlighted = false;  // Đánh dấu khuyến mãi nổi bật

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "promotion", fetch = FetchType.LAZY)
    private List<PromotionUsage> usageHistory = new ArrayList<>();
}
