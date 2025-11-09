package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_variants")
public class ProductVariant {

    @Id
    @UuidGenerator
    private String variantId;

    // Tên biến thể, ví dụ: "Vị Dâu", "Chai 1.5L", "Size M"
    @Column(nullable = false)
    private String name;

    // SKU để quản lý kho hàng duy nhất cho biến thể này
    @Column(unique = true)
    private String sku;

    // Giá có thể khác nhau cho mỗi biến thể
    private BigDecimal originalPrice;
    private BigDecimal discountPrice;

    // Ngày sản xuất và HẠN SỬ DỤNG là của từng biến thể cụ thể
    private LocalDate manufacturingDate;
    private LocalDate expiryDate;

    // Một biến thể sẽ thuộc về một sản phẩm cha
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Tồn kho của biến thể này được quản lý tại mỗi cửa hàng
    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StoreProduct> storeProducts = new ArrayList<>();

    // Ảnh riêng cho biến thể này
    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ProductImage> variantImages = new ArrayList<>();

    // Reviews for this specific variant
    @OneToMany(mappedBy = "productVariant", fetch = FetchType.LAZY)
    private List<Review> reviews = new ArrayList<>();

    /**
     * Get total stock quantity across all stores for this variant
     * @return total stock quantity
     */
    public int getTotalStock() {
        return storeProducts.stream()
                .mapToInt(StoreProduct::getStockQuantity)
                .sum();
    }

    /**
     * Check if this variant is out of stock (0 quantity in all stores)
     * @return true if out of stock
     */
    public boolean isOutOfStock() {
        return getTotalStock() == 0;
    }

    /**
     * Check if this variant has expired
     * @return true if expiry date has passed
     */
    public boolean isExpired() {
        if (expiryDate == null) {
            return false;
        }
        return expiryDate.isBefore(LocalDate.now());
    }

    /**
     * Check if this variant is available (has stock and not expired)
     * @return true if available for purchase
     */
    public boolean isAvailable() {
        return !isOutOfStock() && !isExpired();
    }
}