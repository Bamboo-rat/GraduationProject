package com.example.backend.repository;

import com.example.backend.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, String> {

    // Find images by product (primary images first)
    List<ProductImage> findByProductProductIdOrderByIsPrimaryDesc(String productProductId);

    // Delete all images of a product
    void deleteByProductProductId(String productProductId);
}
