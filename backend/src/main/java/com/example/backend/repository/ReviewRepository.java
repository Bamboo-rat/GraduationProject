package com.example.backend.repository;

import com.example.backend.entity.Customer;
import com.example.backend.entity.OrderDetail;
import com.example.backend.entity.ProductVariant;
import com.example.backend.entity.Review;
import com.example.backend.entity.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {

    /**
     * Find review by order detail
     */
    Optional<Review> findByOrderDetail(OrderDetail orderDetail);

    /**
     * Check if customer already reviewed this order detail
     */
    boolean existsByOrderDetail(OrderDetail orderDetail);

    /**
     * Find all reviews by product variant
     */
    Page<Review> findByProductVariantAndMarkedAsSpamFalseOrderByCreatedAtDesc(ProductVariant productVariant, Pageable pageable);

    /**
     * Find all reviews by customer
     */
    Page<Review> findByCustomerOrderByCreatedAtDesc(Customer customer, Pageable pageable);

    /**
     * Find all reviews by customer (no pagination)
     */
    List<Review> findByCustomer(Customer customer);

    /**
     * Find recent reviews by customer (last 20)
     */
    List<Review> findTop20ByCustomerOrderByCreatedAtDesc(Customer customer);

    /**
     * Find all reviews by store
     */
    Page<Review> findByStoreAndMarkedAsSpamFalseOrderByCreatedAtDesc(Store store, Pageable pageable);

    /**
     * Calculate average rating for product variant (excluding spam)
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productVariant = :variant AND r.markedAsSpam = false")
    Double calculateAverageRating(@Param("variant") ProductVariant variant);

    /**
     * Count reviews for product variant (excluding spam)
     */
    @Query("SELECT COUNT(r) FROM Review r WHERE r.productVariant = :variant AND r.markedAsSpam = false")
    long countReviewsByProductVariant(@Param("variant") ProductVariant variant);

    /**
     * Calculate average rating for store (excluding spam)
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.store = :store AND r.markedAsSpam = false")
    Double calculateStoreAverageRating(@Param("store") Store store);

    /**
     * Find reviews by rating range for product variant
     */
    @Query("SELECT r FROM Review r WHERE r.productVariant = :variant " +
           "AND r.rating >= :minRating AND r.rating <= :maxRating " +
           "AND r.markedAsSpam = false " +
           "ORDER BY r.createdAt DESC")
    Page<Review> findByProductVariantAndRatingRange(
            @Param("variant") ProductVariant variant,
            @Param("minRating") int minRating,
            @Param("maxRating") int maxRating,
            Pageable pageable
    );

    /**
     * Get rating distribution for product variant
     */
    @Query("SELECT r.rating, COUNT(r) FROM Review r " +
           "WHERE r.productVariant = :variant AND r.markedAsSpam = false " +
           "GROUP BY r.rating ORDER BY r.rating DESC")
    List<Object[]> getRatingDistribution(@Param("variant") ProductVariant variant);

    /**
     * Find spam reviews (for admin moderation)
     */
    Page<Review> findByMarkedAsSpamTrueOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Find reviews with comment containing keyword for product variant
     */
    @Query("SELECT r FROM Review r WHERE r.productVariant = :variant " +
           "AND r.markedAsSpam = false " +
           "AND LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY r.createdAt DESC")
    Page<Review> searchByKeyword(
            @Param("variant") ProductVariant variant,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
