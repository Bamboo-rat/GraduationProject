package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "product_images")
public class ProductImage {
    @Id
    @UuidGenerator
    private String imageId;

    private String imageUrl;
    
    // Đánh dấu ảnh chính (primary/default image)
    @Column(name = "is_primary")
    private boolean isPrimary = false;

    // Liên kết với sản phẩm gốc (cho ảnh chung của sản phẩm)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    // Liên kết với biến thể cụ thể (cho ảnh riêng của từng biến thể)
    // Nếu variantId != null thì ảnh này thuộc về biến thể
    // Nếu variantId == null thì ảnh này thuộc về sản phẩm chung
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;
}