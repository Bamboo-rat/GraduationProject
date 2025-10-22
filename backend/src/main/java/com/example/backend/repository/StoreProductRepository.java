package com.example.backend.repository;

import com.example.backend.entity.StoreProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreProductRepository extends JpaRepository<StoreProduct, String> {

    // Find by store and variant
    Optional<StoreProduct> findByStoreStoreIdAndVariantVariantId(String storeStoreId, String variantVariantId);

    // Find all inventory for a store
    List<StoreProduct> findByStoreStoreId(String storeStoreId);

    // Find all stores that have a specific variant
    List<StoreProduct> findByVariantVariantId(String variantVariantId);

    // Check if store has variant
    boolean existsByStoreStoreIdAndVariantVariantId(String storeStoreId, String variantVariantId);
}
