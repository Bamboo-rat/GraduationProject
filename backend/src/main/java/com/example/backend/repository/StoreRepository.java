package com.example.backend.repository;

import com.example.backend.entity.Store;
import com.example.backend.entity.Supplier;
import com.example.backend.entity.enums.StoreStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
     * Find all stores by supplier ID with pagination
     */
    Page<Store> findBySupplierUserId(String userId, Pageable pageable);

    /**
     * Find all stores by supplier ID and status with pagination
     */
    Page<Store> findBySupplierUserIdAndStatus(String userId, StoreStatus status, Pageable pageable);

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

    /**
     * Search stores by supplier ID with store name filter
     */
    @Query("SELECT s FROM Store s WHERE s.supplier.userId = :userId " +
           "AND (:search IS NULL OR LOWER(s.storeName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.address) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Store> findBySupplierUserIdAndSearch(@Param("userId") String userId,
                                                @Param("search") String search,
                                                Pageable pageable);

    /**
     * Search stores by supplier ID, status, and search term
     */
    @Query("SELECT s FROM Store s WHERE s.supplier.userId = :userId " +
           "AND s.status = :status " +
           "AND (:search IS NULL OR LOWER(s.storeName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.address) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Store> findBySupplierUserIdAndStatusAndSearch(@Param("userId") String userId,
                                                         @Param("status") StoreStatus status,
                                                         @Param("search") String search,
                                                         Pageable pageable);
}
