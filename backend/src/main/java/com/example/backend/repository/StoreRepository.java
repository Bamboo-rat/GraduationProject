package com.example.backend.repository;

import com.example.backend.entity.Store;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.enums.StoreStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Store entity
 */
@Repository
public interface StoreRepository extends JpaRepository<Store, String> {

    /**
     * Find all stores by supplier
     */
    List<Store> findBySupplier(Supplier supplier);

    /**
     * Find all stores by supplier ID (User ID from Supplier extends User)
     */
    List<Store> findBySupplierUserId(String userId);

    /**
     * Find all stores by status
     */
    List<Store> findByStatus(StoreStatus status);

    /**
     * Find active stores by supplier
     */
    List<Store> findBySupplierAndStatus(Supplier supplier, StoreStatus status);

    /**
     * Find store by name and supplier
     */
    Optional<Store> findByStoreNameAndSupplier(String storeName, Supplier supplier);
}
