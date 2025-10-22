package com.example.backend.repository;

import com.example.backend.entity.ProductAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductAttributeRepository extends JpaRepository<ProductAttribute, String> {

    // Find attributes by product
    List<ProductAttribute> findByProductProductId(String productProductId);

    // Delete all attributes of a product
    void deleteByProductProductId(String productProductId);
}
