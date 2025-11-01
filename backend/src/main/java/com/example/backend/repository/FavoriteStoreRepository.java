package com.example.backend.repository;

import com.example.backend.entity.FavoriteStore;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for FavoriteStore entity
 * Manages customer favorite stores
 */
@Repository
public interface FavoriteStoreRepository extends JpaRepository<FavoriteStore, String> {

    /**
     * Find all favorite stores for a customer with pagination
     * Ordered by most recently added first
     *
     * @param customerId Customer user ID
     * @param pageable Pagination parameters
     * @return Page of favorite stores
     */
    @Query("SELECT f FROM FavoriteStore f " +
           "JOIN FETCH f.store s " +
           "WHERE f.customer.userId = :customerId " +
           "ORDER BY f.createdAt DESC")
    Page<FavoriteStore> findByCustomerId(@Param("customerId") String customerId, Pageable pageable);

    /**
     * Check if a store is favorited by a customer
     *
     * @param customerId Customer user ID
     * @param storeId Store ID
     * @return true if favorited, false otherwise
     */
    @Query("SELECT COUNT(f) > 0 FROM FavoriteStore f " +
           "WHERE f.customer.userId = :customerId AND f.store.storeId = :storeId")
    boolean existsByCustomerIdAndStoreId(@Param("customerId") String customerId,
                                         @Param("storeId") String storeId);

    /**
     * Find a favorite store by customer and store IDs
     *
     * @param customerId Customer user ID
     * @param storeId Store ID
     * @return Optional favorite store
     */
    @Query("SELECT f FROM FavoriteStore f " +
           "WHERE f.customer.userId = :customerId AND f.store.storeId = :storeId")
    Optional<FavoriteStore> findByCustomerIdAndStoreId(@Param("customerId") String customerId,
                                                        @Param("storeId") String storeId);

    /**
     * Count favorite stores for a customer
     *
     * @param customerId Customer user ID
     * @return Number of favorite stores
     */
    @Query("SELECT COUNT(f) FROM FavoriteStore f WHERE f.customer.userId = :customerId")
    long countByCustomerId(@Param("customerId") String customerId);

    /**
     * Find favorite by ID and customer (for security check)
     *
     * @param favoriteId Favorite ID
     * @param customerId Customer user ID
     * @return Optional favorite store
     */
    @Query("SELECT f FROM FavoriteStore f " +
           "WHERE f.favoriteId = :favoriteId AND f.customer.userId = :customerId")
    Optional<FavoriteStore> findByIdAndCustomerId(@Param("favoriteId") String favoriteId,
                                                   @Param("customerId") String customerId);

    /**
     * Get most ordered favorite stores for a customer
     * Useful for showing frequently ordered stores
     *
     * @param customerId Customer user ID
     * @param pageable Pagination parameters
     * @return Page of favorite stores ordered by order count
     */
    @Query("SELECT f FROM FavoriteStore f " +
           "JOIN FETCH f.store s " +
           "WHERE f.customer.userId = :customerId " +
           "ORDER BY f.orderCount DESC, f.lastOrderDate DESC")
    Page<FavoriteStore> findMostOrderedByCustomerId(@Param("customerId") String customerId,
                                                     Pageable pageable);
}
