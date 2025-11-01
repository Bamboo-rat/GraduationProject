package com.example.backend.entity;

import com.example.backend.entity.enums.ProductStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_product_status", columnList = "status"),
    @Index(name = "idx_product_supplier", columnList = "supplier_id"),
    @Index(name = "idx_product_category", columnList = "category_id"),
    @Index(name = "idx_product_name", columnList = "name"),
    @Index(name = "idx_product_supplier_status", columnList = "supplier_id, status"),
    @Index(name = "idx_product_category_status", columnList = "category_id, status")
})
@EntityListeners(AuditingEntityListener.class)
public class Product {
    @Id
    @UuidGenerator
    private String productId;

    @Column(nullable = false, length = 200)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private ProductStatus status = ProductStatus.ACTIVE;

    // Timestamp when product became SOLD_OUT or EXPIRED (for auto-INACTIVE scheduler)
    private LocalDate soldOutSince;
    private LocalDate expiredSince;

    // Suspension details (set by admin)
    private String suspensionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ProductAttribute> attributes = new ArrayList<>();

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<Review> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ProductVariant> variants = new ArrayList<>();

    /**
     * Calculate total inventory across all variants and stores
     * @return Total stock quantity
     */
    public int getTotalInventory() {
        return variants.stream()
                .flatMap(variant -> variant.getStoreProducts().stream())
                .mapToInt(StoreProduct::getStockQuantity)
                .sum();
    }

    /**
     * Check if ALL variants have expired
     * @return true if all variants have expired
     */
    public boolean hasExpiredVariant() {
        LocalDate today = LocalDate.now();
        return variants.stream()
                .anyMatch(variant -> variant.getExpiryDate() != null
                        && variant.getExpiryDate().isBefore(today));
    }

    /**
     * Check if ALL variants are expired (every variant has passed expiry date)
     * @return true if all variants are expired
     */
    public boolean allVariantsExpired() {
        if (variants.isEmpty()) {
            return false;
        }
        LocalDate today = LocalDate.now();
        return variants.stream()
                .allMatch(variant -> variant.getExpiryDate() != null
                        && variant.getExpiryDate().isBefore(today));
    }

    /**
     * Check if product has at least one available variant (in stock and not expired)
     * @return true if at least one variant is available
     */
    public boolean hasAvailableVariant() {
        return variants.stream()
                .anyMatch(ProductVariant::isAvailable);
    }

    /**
     * Get count of available variants
     * @return number of variants that are in stock and not expired
     */
    public long getAvailableVariantCount() {
        return variants.stream()
                .filter(ProductVariant::isAvailable)
                .count();
    }

    /**
     * Check if product should be auto-set to INACTIVE
     * (SOLD_OUT or EXPIRED for more than 1 day)
     * @return true if eligible for auto-INACTIVE
     */
    public boolean shouldAutoSetInactive() {
        LocalDate oneDayAgo = LocalDate.now().minusDays(1);

        if (soldOutSince != null && soldOutSince.isBefore(oneDayAgo)) {
            return true;
        }

        if (expiredSince != null && expiredSince.isBefore(oneDayAgo)) {
            return true;
        }

        return false;
    }
}
