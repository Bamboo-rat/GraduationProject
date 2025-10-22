package com.example.backend.repository;

import com.example.backend.entity.Product;
import com.example.backend.entity.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    // Find products by supplier
    Page<Product> findBySupplierUserId(String supplierUserId, Pageable pageable);

    // Find products by supplier and status
    Page<Product> findBySupplierUserIdAndStatus(String supplierUserId, ProductStatus status, Pageable pageable);

    // Find products by category
    Page<Product> findByCategoryCategoryId(String categoryCategoryId, Pageable pageable);

    // Find products by status
    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    // Find products by status and category
    Page<Product> findByStatusAndCategoryCategoryId(ProductStatus status, String categoryCategoryId, Pageable pageable);

    // Find active products (ACTIVE or HIDDEN status)
    @Query("SELECT p FROM Product p WHERE p.supplier.userId = :supplierId AND p.status IN ('ACTIVE', 'HIDDEN')")
    Page<Product> findActiveProductsBySupplierId(@Param("supplierId") String supplierId, Pageable pageable);

    // Search products by name
    @Query("SELECT p FROM Product p WHERE p.supplier.userId = :supplierId AND LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Product> searchProductsByName(@Param("supplierId") String supplierId, @Param("name") String name, Pageable pageable);

    // Check if product belongs to supplier
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Product p WHERE p.productId = :productId AND p.supplier.userId = :supplierId")
    boolean existsByProductIdAndSupplierId(@Param("productId") String productId, @Param("supplierId") String supplierId);

    // Count products by supplier
    long countBySupplierUserId(String supplierUserId);

    // Count products by supplier and status
    long countBySupplierUserIdAndStatus(String supplierUserId, ProductStatus status);
}
