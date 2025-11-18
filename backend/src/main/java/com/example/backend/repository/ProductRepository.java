package com.example.backend.repository;

import com.example.backend.entity.Product;
import com.example.backend.entity.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {

    // Find products by supplier
    Page<Product> findBySupplierUserId(String supplierUserId, Pageable pageable);

    // Find products by supplier (non-paginated)
    java.util.List<Product> findBySupplierUserId(String supplierUserId);

    // Find products by supplier and status
    Page<Product> findBySupplierUserIdAndStatus(String supplierUserId, ProductStatus status, Pageable pageable);

    // Find products by category
    Page<Product> findByCategoryCategoryId(String categoryCategoryId, Pageable pageable);

    // Find products by status (paginated)
    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    // Find products by status (all - for scheduler)
    java.util.List<Product> findByStatus(ProductStatus status);

    // Find products by status and category
    Page<Product> findByStatusAndCategoryCategoryId(ProductStatus status, String categoryCategoryId, Pageable pageable);

    // Find active products (ACTIVE or INACTIVE status)
    @Query("SELECT p FROM Product p WHERE p.supplier.userId = :supplierId AND p.status IN (com.example.backend.entity.enums.ProductStatus.ACTIVE, com.example.backend.entity.enums.ProductStatus.INACTIVE)")
    Page<Product> findActiveProductsBySupplierId(@Param("supplierId") String supplierId, Pageable pageable);

    // Search products by name
    @Query("SELECT p FROM Product p WHERE p.supplier.userId = :supplierId AND LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Product> searchProductsByName(@Param("supplierId") String supplierId, @Param("name") String name, Pageable pageable);

    // Search products by name and status
    @Query("SELECT p FROM Product p WHERE p.supplier.userId = :supplierId AND p.status = :status AND LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Product> searchProductsByNameAndStatus(@Param("supplierId") String supplierId, @Param("name") String name, @Param("status") ProductStatus status, Pageable pageable);

    // Check if product belongs to supplier
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Product p WHERE p.productId = :productId AND p.supplier.userId = :supplierId")
    boolean existsByProductIdAndSupplierId(@Param("productId") String productId, @Param("supplierId") String supplierId);

    // Count products by supplier
    long countBySupplierUserId(String supplierUserId);

    // Count products by supplier and status
    long countBySupplierUserIdAndStatus(String supplierUserId, ProductStatus status);

    // CRITICAL FIX: Query methods that filter by supplier status = ACTIVE
    // These ensure products from paused/suspended suppliers are hidden from customers

    @Query("SELECT p FROM Product p WHERE p.supplier.status = 'ACTIVE'")
    Page<Product> findAllFromActiveSuppliers(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = :status AND p.supplier.status = 'ACTIVE'")
    Page<Product> findByStatusFromActiveSuppliers(@Param("status") ProductStatus status, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.category.categoryId = :categoryId AND p.supplier.status = 'ACTIVE'")
    Page<Product> findByCategoryFromActiveSuppliers(@Param("categoryId") String categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status = :status AND p.category.categoryId = :categoryId AND p.supplier.status = 'ACTIVE'")
    Page<Product> findByStatusAndCategoryFromActiveSuppliers(
            @Param("status") ProductStatus status,
            @Param("categoryId") String categoryId,
            Pageable pageable);

    // Count products by category and status
    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.categoryId = :categoryId AND p.status = :status")
    long countByCategoryIdAndStatus(@Param("categoryId") String categoryId, @Param("status") ProductStatus status);
}
