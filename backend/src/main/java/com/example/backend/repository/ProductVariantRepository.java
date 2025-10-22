package com.example.backend.repository;

import com.example.backend.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, String> {

    // Find variants by product
    List<ProductVariant> findByProductProductId(String productProductId);

    // Find variant by SKU
    Optional<ProductVariant> findBySku(String sku);

    // Check if SKU exists
    boolean existsBySku(String sku);

    // Check if SKU exists for another variant
    boolean existsBySkuAndVariantIdNot(String sku, String variantId);

    // Delete all variants of a product
    void deleteByProductProductId(String productProductId);
}
