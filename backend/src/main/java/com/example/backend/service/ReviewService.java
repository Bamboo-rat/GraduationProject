package com.example.backend.service;

import com.example.backend.dto.request.CreateReviewRequest;
import com.example.backend.dto.request.UpdateReviewRequest;
import com.example.backend.dto.response.ProductRatingResponse;
import com.example.backend.dto.response.ReviewResponse;
import org.springframework.data.domain.Page;

public interface ReviewService {

    /**
     * Customer creates a review for an order detail
     */
    ReviewResponse createReview(String customerId, CreateReviewRequest request);

    /**
     * Customer updates their review
     */
    ReviewResponse updateReview(String customerId, String reviewId, UpdateReviewRequest request);

    /**
     * Customer deletes their review
     */
    void deleteReview(String customerId, String reviewId);

    /**
     * Get review by ID
     */
    ReviewResponse getReviewById(String reviewId);

    /**
     * Get all reviews by customer
     */
    Page<ReviewResponse> getCustomerReviews(String customerId, int page, int size);

    /**
     * Get all reviews for a product
     */
    Page<ReviewResponse> getProductReviews(String productId, Integer rating, int page, int size);

    /**
     * Get all reviews for a store
     */
    Page<ReviewResponse> getStoreReviews(String storeId, int page, int size);

    /**
     * Get product rating statistics
     */
    ProductRatingResponse getProductRating(String productId);

    /**
     * Admin marks review as spam
     */
    ReviewResponse markAsSpam(String reviewId, boolean isSpam);

    /**
     * Get spam reviews for moderation (admin only)
     */
    Page<ReviewResponse> getSpamReviews(int page, int size);

    /**
     * Search reviews by keyword
     */
    Page<ReviewResponse> searchReviews(String productId, String keyword, int page, int size);

    /**
     * Supplier replies to a review
     */
    ReviewResponse replyToReview(String supplierId, String reviewId, String reply);

    /**
     * Supplier updates their reply
     */
    ReviewResponse updateReply(String supplierId, String reviewId, String reply);

    /**
     * Supplier deletes their reply
     */
    void deleteReply(String supplierId, String reviewId);

    /**
     * Supplier reports a review as inappropriate
     */
    void reportReview(String supplierId, String reviewId, String reason);
}
