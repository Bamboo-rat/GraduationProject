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
    @Index(name = "idx_product_expiry", columnList = "expiryDate"),
    @Index(name = "idx_product_price", columnList = "originalPrice"),
    @Index(name = "idx_product_discount_price", columnList = "discountPrice"),
    @Index(name = "idx_product_supplier_status", columnList = "supplier_id, status"),
    @Index(name = "idx_product_category_status", columnList = "category_id, status")
})
@EntityListeners(AuditingEntityListener.class)
public class Product {
    @Id
    @UuidGenerator
    private String productId;

    private String name;
    private String description;
    private BigDecimal originalPrice;
    private BigDecimal discountPrice;

    @Column(name = "manufacturing_date")
    private LocalDate manufacturingDate;

    private LocalDate expiryDate; // ngày hết hạn

    @Enumerated(EnumType.STRING)
    private ProductStatus status = ProductStatus.PENDING_APPROVAL;

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
    private List<StoreProduct> storeProducts = new ArrayList<>();
}
