package com.example.backend.service;

import com.example.backend.dto.request.PromotionRequest;
import com.example.backend.dto.response.PromotionResponse;
import com.example.backend.entity.enums.PromotionStatus;
import com.example.backend.entity.enums.PromotionTier;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;

/**
 * Service interface for promotion management
 */
public interface PromotionService {

    /**
     * Create a new promotion
     *
     * @param request Promotion creation request
     * @return Created promotion response
     */
    PromotionResponse createPromotion(PromotionRequest request);

    /**
     * Update an existing promotion
     *
     * @param promotionId ID of the promotion to update
     * @param request Promotion update request
     * @return Updated promotion response
     */
    PromotionResponse updatePromotion(String promotionId, PromotionRequest request);

    /**
     * Get promotion by ID
     *
     * @param promotionId Promotion ID
     * @return Promotion response
     */
    PromotionResponse getPromotionById(String promotionId);

    /**
     * Get promotion by code
     *
     * @param code Promotion code
     * @return Promotion response
     */
    PromotionResponse getPromotionByCode(String code);

    /**
     * Get all promotions with pagination and filtering
     *
     * @param page Page number (0-indexed)
     * @param size Page size
     * @param status Promotion status filter (optional)
     * @param tier Promotion tier filter (optional)
     * @param isHighlighted Highlighted filter (optional)
     * @param search Search term for code/title/description (optional)
     * @param sortBy Sort field
     * @param sortDirection Sort direction (ASC/DESC)
     * @return Page of promotion responses
     */
    Page<PromotionResponse> getAllPromotions(
            int page,
            int size,
            PromotionStatus status,
            PromotionTier tier,
            Boolean isHighlighted,
            String search,
            String sortBy,
            String sortDirection
    );

    /**
     * Delete a promotion (hard delete)
     *
     * @param promotionId Promotion ID
     */
    void deletePromotion(String promotionId);

    /**
     * Toggle promotion active status
     *
     * @param promotionId Promotion ID
     * @param status New status
     * @return Updated promotion response
     */
    PromotionResponse toggleStatus(String promotionId, PromotionStatus status);

    /**
     * Validate promotion code for an order
     *
     * @param code Promotion code
     * @param customerId Customer ID (optional for tier validation)
     * @param orderAmount Order amount
     * @return Promotion response if valid
     */
    PromotionResponse validatePromotionCode(String code, String customerId, BigDecimal orderAmount);

    /**
     * Apply promotion to an order (atomic operation with race condition protection)
     * This method validates AND increments usage count in a transaction-safe way
     *
     * @param code Promotion code
     * @param customerId Customer ID
     * @param orderAmount Order amount
     * @return Promotion response if successfully applied
     * @throws BadRequestException if promotion cannot be applied (invalid, expired, or limit reached)
     */
    PromotionResponse applyPromotionToOrder(String code, String customerId, BigDecimal orderAmount);
}
