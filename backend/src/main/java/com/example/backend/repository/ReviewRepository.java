package com.example.backend.repository;

import com.example.backend.entity.Customer;
import com.example.backend.entity.OrderDetail;
import com.example.backend.entity.Product;
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
     * Find all reviews by product
     */
    Page<Review> findByProductAndMarkedAsSpamFalseOrderByCreatedAtDesc(Product product, Pageable pageable);

    /**
     * Find all reviews by customer
     */
    Page<Review> findByCustomerOrderByCreatedAtDesc(Customer customer, Pageable pageable);

    /**
     * Find all reviews by store
     */
    Page<Review> findByStoreAndMarkedAsSpamFalseOrderByCreatedAtDesc(Store store, Pageable pageable);

    /**
     * Calculate average rating for product (excluding spam)
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product = :product AND r.markedAsSpam = false")
    Double calculateAverageRating(@Param("product") Product product);

    /**
     * Count reviews for product (excluding spam)
     */
    @Query("SELECT COUNT(r) FROM Review r WHERE r.product = :product AND r.markedAsSpam = false")
    long countReviewsByProduct(@Param("product") Product product);

    /**
     * Calculate average rating for store (excluding spam)
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.store = :store AND r.markedAsSpam = false")
    Double calculateStoreAverageRating(@Param("store") Store store);

    /**
     * Find reviews by rating range
     */
    @Query("SELECT r FROM Review r WHERE r.product = :product " +
           "AND r.rating >= :minRating AND r.rating <= :maxRating " +
           "AND r.markedAsSpam = false " +
           "ORDER BY r.createdAt DESC")
    Page<Review> findByProductAndRatingRange(
            @Param("product") Product product,
            @Param("minRating") int minRating,
            @Param("maxRating") int maxRating,
            Pageable pageable
    );

    /**
     * Get rating distribution for product
     */
    @Query("SELECT r.rating, COUNT(r) FROM Review r " +
           "WHERE r.product = :product AND r.markedAsSpam = false " +
           "GROUP BY r.rating ORDER BY r.rating DESC")
    List<Object[]> getRatingDistribution(@Param("product") Product product);

    /**
     * Find spam reviews (for admin moderation)
     */
    Page<Review> findByMarkedAsSpamTrueOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Find reviews with comment containing keyword
     */
    @Query("SELECT r FROM Review r WHERE r.product = :product " +
           "AND r.markedAsSpam = false " +
           "AND LOWER(r.comment) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY r.createdAt DESC")
    Page<Review> searchByKeyword(
            @Param("product") Product product,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
