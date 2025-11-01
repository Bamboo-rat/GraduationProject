package com.example.backend.service;

import com.example.backend.dto.response.FavoriteStoreResponse;
import org.springframework.data.domain.Page;

/**
 * Service interface for managing customer favorite stores
 */
public interface FavoriteStoreService {

    /**
     * Get all favorite stores for a customer
     *
     * @param customerId Customer user ID
     * @param page Page number (0-indexed)
     * @param size Page size
     * @return Page of favorite stores
     */
    Page<FavoriteStoreResponse> getFavoriteStores(String customerId, int page, int size);

    /**
     * Get most frequently ordered favorite stores
     *
     * @param customerId Customer user ID
     * @param page Page number (0-indexed)
     * @param size Page size
     * @return Page of favorite stores ordered by order count
     */
    Page<FavoriteStoreResponse> getMostOrderedFavorites(String customerId, int page, int size);

    /**
     * Add a store to customer's favorites
     * If already favorited, no action taken (idempotent)
     *
     * @param customerId Customer user ID
     * @param storeId Store ID to favorite
     * @return Created favorite store
     */
    FavoriteStoreResponse addFavoriteStore(String customerId, String storeId);

    /**
     * Remove a store from customer's favorites
     *
     * @param customerId Customer user ID
     * @param storeId Store ID to unfavorite
     */
    void removeFavoriteStore(String customerId, String storeId);

    /**
     * Check if a store is favorited by customer
     *
     * @param customerId Customer user ID
     * @param storeId Store ID
     * @return true if favorited, false otherwise
     */
    boolean isFavorited(String customerId, String storeId);

    /**
     * Get count of favorite stores for a customer
     *
     * @param customerId Customer user ID
     * @return Number of favorite stores
     */
    long getFavoriteCount(String customerId);
}
